const express = require('express');
const router = express.Router();
const AdminController = require('../Controllers/AdminController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.get('/stats', auth, roles(['admin']), AdminController.getStats);

module.exports = router;