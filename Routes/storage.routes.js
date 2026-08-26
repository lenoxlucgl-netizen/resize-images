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

router.post('/upload-api', apiKey, upload.single('file'), StorageController.upload);

router.get('/object/*', async (req, res) => {
	try {
		const key = req.params[0];
		const object = await StorageService.getFile(process.env.MINIO_BUCKET || 'savedimages', key);
		res.set('Content-Type', object.ContentType || 'application/octet-stream');
		object.Body.pipe(res);
	} catch (error) {
		res.status(404).json({ error: 'File non trovato' });
	}
});

module.exports = router;