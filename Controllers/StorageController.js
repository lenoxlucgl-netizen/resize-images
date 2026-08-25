    const StorageService = require('../services/StorageService');
const ResizeService = require('../services/ResizeService');

class StorageController {
  static async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const bucket = process.env.MINIO_BUCKET || 'local-images';
      const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
      const key = cleanName;
      const isVideo = req.file.mimetype.startsWith('video/');

      if (isVideo) {
        const videoKey = `videos/${key}`;
        await StorageService.uploadFile(bucket, videoKey, req.file.buffer, req.file.mimetype);
        return res.status(201).json({ 
          original: videoKey,
          keepOriginal: true,
          variants: [],
          message: 'Video salvato correttamente'
        });
      }

      const keepOriginal = req.body.keepOriginal !== 'false';
      const requestedSizes = Array.isArray(req.body.sizes) ? req.body.sizes : [req.body.sizes];
      const sizes = requestedSizes.map(size => String(size || '').trim()).filter(Boolean);
      if (!sizes.length || sizes.length > 5 || new Set(sizes).size !== sizes.length || sizes.some(size => {
        const dimensions = size.split('x').map(Number);
        return !/^\d{1,5}x\d{1,5}$/.test(size) || dimensions.some(dimension => dimension === 0);
      })) {
        return res.status(400).json({ error: 'Seleziona almeno una dimensione valida' });
      }

      const { variants, originalDimension } = await ResizeService.processImage(req.file.buffer, key, bucket, sizes);
      
      const ext = key.split('.').pop();
      const baseName = key.substring(0, key.lastIndexOf('.'));
      const originalFinalKey = `${baseName}-${originalDimension}.${ext}`;

      if (keepOriginal) {
        await StorageService.uploadFile(bucket, originalFinalKey, req.file.buffer, req.file.mimetype);
      }

      res.status(201).json({ 
        original: keepOriginal ? originalFinalKey : null,
        keepOriginal,
        variants,
        message: keepOriginal ? 'Immagine salvata con originali' : 'Immagine salvata solo nelle versioni modificate'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = StorageController;