    const StorageService = require('../services/StorageService');
const ResizeService = require('../services/ResizeService');

class StorageController {
  static async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      // Il bucket di destinazione è quello richiesto, altrimenti quello dell'API key, altrimenti default
      const defaultAuthBucket = req.authorizedBucket === '*' ? null : req.authorizedBucket;
      const targetBucket = (req.body.bucket && req.body.bucket.trim()) ? req.body.bucket.trim() : (defaultAuthBucket || process.env.MINIO_BUCKET || 'savedimages');

      // Se l'API key è limitata a un bucket, deve coincidere con il bucket di destinazione
      if (req.authorizedBucket && req.authorizedBucket !== '*' && req.authorizedBucket !== targetBucket) {
        return res.status(403).json({ error: 'Questa API non possiede i permessi per scrivere in questo Bucket' });
      }

      const bucket = targetBucket;
      let customPath = req.body.path ? req.body.path.trim() : '';
      customPath = customPath.replace(/^[\/\\]+/, '').replace(/[\/\\]+$/, ''); // Rimuove slash iniziali/finali
      if (customPath.includes('..')) return res.status(400).json({ error: 'Percorso non valido' });

      let customResizedPath = req.body.resizedPath !== undefined ? req.body.resizedPath.trim() : null;
      if (customResizedPath !== null) {
          customResizedPath = customResizedPath.replace(/^[\/\\]+/, '').replace(/[\/\\]+$/, '');
          if (customResizedPath.includes('..')) return res.status(400).json({ error: 'Percorso modificate non valido' });
      }

      const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
      const key = customPath ? `${customPath}/${cleanName}` : cleanName;
      const isImage = req.file.mimetype.startsWith('image/');

      if (!isImage) {
        const folder = req.file.mimetype.startsWith('video/') ? 'videos' : 'files';
        const fileKey = customPath ? `${customPath}/${cleanName}` : `${folder}/${cleanName}`;
        await StorageService.uploadFile(bucket, fileKey, req.file.buffer, req.file.mimetype);
        return res.status(201).json({ 
          bucket,
          original: fileKey,
          keepOriginal: true,
          variants: [],
          message: 'File salvato correttamente'
        });
      }

      if (req.body.keepOriginal === 'only') {
        const originalFinalKey = customPath ? `${customPath}/${cleanName}` : cleanName;
        await StorageService.uploadFile(bucket, originalFinalKey, req.file.buffer, req.file.mimetype);
        return res.status(201).json({ 
          bucket,
          original: originalFinalKey,
          keepOriginal: true,
          variants: [],
          message: 'Immagine originale salvata'
        });
      }

      const keepOriginal = req.body.keepOriginal !== 'false';
      const requestedSizes = Array.isArray(req.body.sizes) ? req.body.sizes : [req.body.sizes];
      const sizes = requestedSizes.map(size => String(size || '').trim()).filter(Boolean);
      if (!sizes.length || new Set(sizes).size !== sizes.length || sizes.some(size => {
        const dimensions = size.split('x').map(Number);
        return !/^\d{1,5}x\d{1,5}$/.test(size) || dimensions.some(dimension => dimension === 0);
      })) {
        return res.status(400).json({ error: 'Seleziona almeno una dimensione valida' });
      }

      // Il processo di salvataggio varianti sovrascriverà i file esistenti

      const { variants, originalDimension } = await ResizeService.processImage(req.file.buffer, cleanName, bucket, sizes, customPath, customResizedPath);
      
      const originalFinalKey = customPath ? `${customPath}/${baseName}-${originalDimension}.${ext}` : `${baseName}-${originalDimension}.${ext}`;

      if (keepOriginal) {
        await StorageService.uploadFile(bucket, originalFinalKey, req.file.buffer, req.file.mimetype);
      }

      res.status(201).json({ 
        bucket,
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