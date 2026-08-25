const express = require('express');
const router = express.Router();
const BucketController = require('../Controllers/BucketController');
const auth = require('../middlewares/auth');

router.post('/', auth, BucketController.createBucket);
router.get('/', auth, BucketController.listBuckets);

module.exports = router;