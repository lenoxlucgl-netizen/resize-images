const sharp = require('sharp');
const StorageService = require('./StorageService');
const resizeConfig = require('../config/resize');

class ResizeService {
  static async processImage(originalBuffer, cleanName, bucket, sizes = resizeConfig.sizes, originalPath = '', resizedPath = null, isPublic = false) {
    const image = sharp(originalBuffer);
    const metadata = await image.metadata();
    const results = [];
    const originalDimension = `${metadata.width}x${metadata.height}`;

    const finalResizedPath = resizedPath !== null ? resizedPath : originalPath;

    for (const size of sizes) {
      const [width, height] = size.split('x').map(Number);
      const ext = cleanName.split('.').pop();
      const baseName = cleanName.substring(0, cleanName.lastIndexOf('.'));
      
      const outputKey = finalResizedPath ? `${finalResizedPath}/${baseName}-${size}.${ext}` : `${baseName}-${size}.${ext}`;

      const resizedBuffer = await image
        .clone()
        .resize(width, height, { fit: 'inside' })
        .toBuffer();

      await StorageService.uploadFile(bucket, outputKey, resizedBuffer, `image/${metadata.format}`, isPublic);
      results.push(outputKey);
    }

    return { variants: results, originalDimension };
  }
}

module.exports = ResizeService;