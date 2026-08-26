const express = require('express');
const router = express.Router();
const multer = require('multer');
const StorageController = require('../Controllers/StorageController');
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

router.get('/object/*', async (req, res) => {
	try {
		const key = req.params[0];
		const bucket = req.query.bucket || process.env.MINIO_BUCKET || 'savedimages';
		const object = await StorageService.getFile(bucket, key);
		res.set('Content-Type', object.ContentType || 'application/octet-stream');
		object.Body.pipe(res);
	} catch (error) {
		res.status(404).json({ error: 'File non trovato' });
	}
});

module.exports = router;