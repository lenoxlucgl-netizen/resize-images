const express = require('express');
const router = express.Router();
const multer = require('multer');
const StorageController = require('../Controllers/StorageController');
const StorageService = require('../services/StorageService');
const apiKey = require('../middlewares/apiKey');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 100 * 1024 * 1024 }, // Limite 100MB
	fileFilter: (req, file, cb) => {
		cb(null, /^(image|video)\/(jpeg|png|webp|gif|avif|tiff|mp4|webm|quicktime|x-msvideo)$/.test(file.mimetype));
	}
});

router.post('/upload', upload.single('file'), StorageController.upload);
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