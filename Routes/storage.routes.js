const express = require('express');
const router = express.Router();
const multer = require('multer');
const StorageController = require('../Controllers/StorageController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), StorageController.upload);

module.exports = router;