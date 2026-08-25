const sharp = require('sharp');
const StorageService = require('./StorageService');
const resizeConfig = require('../config/resize');

class ResizeService {
  static async processImage(originalBuffer, originalKey, bucket, sizes = resizeConfig.sizes) {
    const image = sharp(originalBuffer);
    const metadata = await image.metadata();
    const results = [];

    for (const size of sizes) {
      const [width, height] = size.split('x').map(Number);
      const ext = originalKey.split('.').pop();
      const baseName = originalKey.substring(0, originalKey.lastIndexOf('.'));
      const resizedPath = resizeConfig.resizedPath.replace(/^[/\\]+|[/\\]+$/g, '');
      const outputKey = `${resizedPath}/${baseName}_${size}.${ext}`;

      const resizedBuffer = await image
        .clone()
        .resize(width, height, { fit: 'inside' })
        .toBuffer();

      await StorageService.uploadFile(bucket, outputKey, resizedBuffer, `image/${metadata.format}`);
      results.push(outputKey);
    }

    return results;
  }
}

module.exports = ResizeService;