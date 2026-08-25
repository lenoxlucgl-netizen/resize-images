const express = require('express');
const router = express.Router();
const ResizeController = require('../Controllers/ResizeController');
const auth = require('../middlewares/auth');

router.get('/jobs/:fileId', auth, ResizeController.getJobs);
router.post('/trigger/:fileId', auth, ResizeController.triggerManualResize);

module.exports = router;