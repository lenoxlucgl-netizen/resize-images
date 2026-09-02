const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const StorageService = require('./StorageService');
const FileDbService = require('./FileDbService');

ffmpeg.setFfmpegPath(ffmpegPath);

class VideoService {
  static async extractCoverAndSave(uuid, second = 1) {
    const file = await FileDbService.getFile(uuid);
    if (!file) throw new Error('File non trovato');

    const bucket = file.bucket;
    const key = file.file_key;
    const isPublic = file.is_public;
    const ownerApiKey = file.owner_api_key;

    // Check if it's likely a video
    const ext = key.split('.').pop().toLowerCase();
    
    // Instead of streaming the whole file into memory and saving it, we can pipe it.
    // AWS SDK GetObjectCommand returns a Readable stream in object.Body
    const object = await StorageService.getFile(bucket, key);
    
    const tempVideoPath = path.join(os.tmpdir(), `vid-${crypto.randomUUID()}.${ext}`);
    const tempImagePath = path.join(os.tmpdir(), `img-${crypto.randomUUID()}.jpg`);

    try {
      // Stream to temp file
      // If object.Body is a stream, we pipe it to a file
      if (typeof object.Body.pipe === 'function') {
        const writeStream = fsSync.createWriteStream(tempVideoPath);
        object.Body.pipe(writeStream);
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
      } else {
        // Fallback if not a stream
        const bodyBytes = await object.Body.transformToByteArray();
        await fs.writeFile(tempVideoPath, bodyBytes);
      }

      // Extract frame
      await new Promise((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .seekInput(second)
          .frames(1)
          .outputOptions('-q:v 2')
          .save(tempImagePath)
          .on('end', resolve)
          .on('error', reject);
      });

      // Read extracted image
      const imageBuffer = await fs.readFile(tempImagePath);

      // Save to storage
      const baseName = key.substring(0, key.lastIndexOf('.'));
      const coverKey = `${baseName}_cover_${second}s.jpg`;

      await StorageService.uploadFile(bucket, coverKey, imageBuffer, 'image/jpeg', isPublic);

      // Register to DB
      const coverUuid = crypto.randomUUID();
      await FileDbService.registerFile({ uuid: coverUuid, bucket, fileKey: coverKey, isPublic, ownerApiKey });

      return { coverUuid, coverKey, bucket, isPublic };

    } finally {
      // Clean up
      try { await fs.unlink(tempVideoPath); } catch (e) {}
      try { await fs.unlink(tempImagePath); } catch (e) {}
    }
  }
}

module.exports = VideoService;
