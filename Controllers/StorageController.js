    const StorageService = require('../services/StorageService');
const ResizeService = require('../services/ResizeService');
const { v4: uuidv4 } = require('uuid');

class StorageController {
  static async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const bucket = process.env.MINIO_BUCKET;
      const key = `${uuidv4()}-${req.file.originalname}`;
      
      // Upload originale
      await StorageService.uploadFile(bucket, key, req.file.buffer, req.file.mimetype);

      // Trigger Resize (in produzione usare coda/worker)
      const variants = await ResizeService.processImage(req.file.buffer, key, bucket);

      res.status(201).json({ 
        original: key, 
        variants,
        message: 'Upload successful' 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = StorageController;