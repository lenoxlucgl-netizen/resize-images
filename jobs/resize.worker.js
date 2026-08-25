const EventService = require('../services/EventService');
const ResizeService = require('../services/ResizeService');
const File = require('../Models/File');
const resizeConfig = require('../config/resize');

class ResizeWorker {
  static async start() {
    console.log('Resize Worker started');
    
    EventService.subscribe(async (eventData) => {
      if (eventData.event === 'image.uploaded') {
        try {
          const fileRecord = await File.findById(eventData.payload.fileId);
          if (!fileRecord) return;

          console.log(`Processing resize for file: ${fileRecord.original_name}`);
          
          // Scarica l'originale (implementa GetObjectCommand in StorageService)
          const { Body } = await require('../utils/s3Client').send(
            new (require('@aws-sdk/client-s3').GetObjectCommand)({
              Bucket: fileRecord.bucket_id,
              Key: fileRecord.stored_path
            })
          );

          const buffer = await Body.transformToByteArray();
          const variants = await ResizeService.processImage(
            Buffer.from(buffer), 
            fileRecord.stored_path, 
            fileRecord.bucket_id
          );

          await EventService.emit('image.resized', {
            fileId: fileRecord.id,
            variants
          });

        } catch (error) {
          console.error('Resize failed:', error);
          await EventService.emit('image.failed', {
            fileId: eventData.payload.fileId,
            error: error.message
          });
        }
      }
    });
  }
}

module.exports = ResizeWorker;