    const StorageService = require('../services/StorageService');
const ResizeService = require('../services/ResizeService');
const FileDbService = require('../services/FileDbService');
const SecurityService = require('../services/SecurityService');
const crypto = require('crypto');

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
      const ownerApiKey = req.apiKeyHash || null; // Recuperiamo l'hash dell'API key salvato dal middleware
      const isPublic = req.body.isPublic === 'true'; // Se è true sarà accessibile via Signed URL

      const getFileUrl = (uuid) => {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        if (isPublic) {
          const signature = SecurityService.generateSignature(uuid);
          return `${baseUrl}/api/files/read/${uuid}?signature=${signature}`;
        }
        return `${baseUrl}/api/files/private/${uuid}`;
      };
      
      let customPath = req.body.path !== undefined ? req.body.path.trim() : null;
      if (customPath !== null) {
        customPath = customPath.replace(/^[\/\\]+/, '').replace(/[\/\\]+$/, ''); // Rimuove slash iniziali/finali
        if (customPath.includes('..')) return res.status(400).json({ error: 'Percorso non valido' });
      }

      let customResizedPath = req.body.resizedPath !== undefined ? req.body.resizedPath.trim() : null;
      if (customResizedPath !== null) {
          customResizedPath = customResizedPath.replace(/^[\/\\]+/, '').replace(/[\/\\]+$/, '');
          if (customResizedPath.includes('..')) return res.status(400).json({ error: 'Percorso modificate non valido' });
      }

      const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
      const isImage = req.file.mimetype.startsWith('image/');

      if (!isImage) {
        const folder = req.file.mimetype.startsWith('video/') ? 'videos' : 'files';
        const fileKey = customPath !== null 
            ? [customPath, cleanName].filter(Boolean).join('/')
            : [folder, cleanName].filter(Boolean).join('/');
        await StorageService.uploadFile(bucket, fileKey, req.file.buffer, req.file.mimetype, isPublic);
        
        const uuid = crypto.randomUUID();
        await FileDbService.registerFile({ uuid, bucket, fileKey, isPublic, ownerApiKey });
        
        return res.status(201).json({ 
          bucket,
          original: { uuid, url: getFileUrl(uuid) },
          keepOriginal: true,
          variants: [],
          message: 'File salvato correttamente'
        });
      }

      if (req.body.keepOriginal === 'only') {
        const originalFinalKey = [customPath, cleanName].filter(Boolean).join('/');
        await StorageService.uploadFile(bucket, originalFinalKey, req.file.buffer, req.file.mimetype, isPublic);
        
        const uuid = crypto.randomUUID();
        await FileDbService.registerFile({ uuid, bucket, fileKey: originalFinalKey, isPublic, ownerApiKey });

        return res.status(201).json({ 
          bucket,
          original: { uuid, url: getFileUrl(uuid) },
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

      // Il processo di salvataggio varianti (restituirà path fisici)
      const finalCustomPath = [customPath].filter(Boolean).join('/');
      const finalCustomResizedPath = customResizedPath !== null 
          ? [customResizedPath].filter(Boolean).join('/')
          : null;
      const { variants: variantKeys, originalDimension } = await ResizeService.processImage(req.file.buffer, cleanName, bucket, sizes, finalCustomPath, finalCustomResizedPath, isPublic);
      
      const variantObjs = [];
      for (const vKey of variantKeys) {
          const vUuid = crypto.randomUUID();
          await FileDbService.registerFile({ uuid: vUuid, bucket, fileKey: vKey, isPublic, ownerApiKey });
          variantObjs.push({ uuid: vUuid, url: getFileUrl(vUuid) });
      }

      const ext = cleanName.substring(cleanName.lastIndexOf('.') + 1);
      const baseName = cleanName.substring(0, cleanName.lastIndexOf('.'));
      const originalFinalKey = [customPath, `${baseName}-${originalDimension}.${ext}`].filter(Boolean).join('/');

      let originalObj = null;
      if (keepOriginal) {
        await StorageService.uploadFile(bucket, originalFinalKey, req.file.buffer, req.file.mimetype, isPublic);
        const originalUuid = crypto.randomUUID();
        await FileDbService.registerFile({ uuid: originalUuid, bucket, fileKey: originalFinalKey, isPublic, ownerApiKey });
        originalObj = { uuid: originalUuid, url: getFileUrl(originalUuid) };
      }

      res.status(201).json({ 
        bucket,
        original: originalObj,
        keepOriginal,
        variants: variantObjs,
        message: keepOriginal ? 'Immagine salvata con originali' : 'Immagine salvata solo nelle versioni modificate'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = StorageController;