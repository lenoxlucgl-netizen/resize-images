const express = require('express');
const router = express.Router();
const multer = require('multer');
const StorageController = require('../Controllers/StorageController');
const AccessController = require('../Controllers/AccessController');
const StorageService = require('../services/StorageService');
const apiKey = require('../middlewares/apiKey');
const adminAuth = require('../middlewares/adminAuth');

const upload = multer({
	storage: multer.memoryStorage()
});

router.get('/buckets', adminAuth, async (req, res) => {
  try {
    const buckets = await StorageService.listBuckets();
    res.json({ buckets });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dei bucket' });
  }
});

router.post('/bucket-policy', adminAuth, async (req, res) => {
  try {
    const { bucket, policy } = req.body;
    if (!bucket || !policy) {
      return res.status(400).json({ error: 'Manca bucket o policy' });
    }
    // Converte l'oggetto JSON in stringa se necessario
    const policyString = typeof policy === 'string' ? policy : JSON.stringify(policy);
    
    await StorageService.setBucketPolicy(bucket, policyString);
    res.json({ success: true, message: 'Policy applicata con successo su MinIO' });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante l\'applicazione della policy', details: error.message });
  }
});

router.get('/my-buckets', apiKey, async (req, res) => {
  try {
    if (req.authorizedBucket === '*') {
      const buckets = await StorageService.listBuckets();
      return res.json({ buckets, global: true });
    } else {
      return res.json({ buckets: [req.authorizedBucket], global: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero dei bucket' });
  }
});

router.post('/upload-api', apiKey, upload.single('file'), StorageController.upload);

router.get('/list/:bucket', apiKey, async (req, res) => {
  try {
    const bucket = req.params.bucket;
    if (req.authorizedBucket !== '*' && req.authorizedBucket !== bucket) {
      return res.status(403).json({ error: 'Accesso negato al bucket' });
    }
    const files = await StorageService.listObjects(bucket);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero della lista file' });
  }
});

router.delete('/object/:bucket/*', apiKey, async (req, res) => {
  try {
    const bucket = req.params.bucket;
    const key = req.params[0];
    if (req.authorizedBucket !== '*' && req.authorizedBucket !== bucket) {
      return res.status(403).json({ error: 'Accesso negato al bucket' });
    }
    await StorageService.deleteFile(bucket, key);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante l\'eliminazione del file' });
  }
});

// Nuove rotte per Signed URL e download
router.get('/signed-url/:uuid', apiKey, AccessController.generateSignedUrl);
router.post('/get-signature', apiKey, AccessController.getSignatureFromUrl);
router.get('/get-signature', apiKey, AccessController.getSignatureFromUrl);
router.get('/read/:uuid', AccessController.readPublicFile); // Endpoint pubblico libero
router.get('/private-signed/:uuid', AccessController.readPrivateSignedFile);
router.get('/private/:uuid', apiKey, AccessController.readPrivateFile); // Endpoint privato tramite API Key

module.exports = router;