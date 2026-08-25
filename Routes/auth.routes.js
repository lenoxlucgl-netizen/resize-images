const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - TO BE IMPLEMENTED' });
});

module.exports = router;