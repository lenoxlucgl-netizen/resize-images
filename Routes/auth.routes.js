const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiKeyService = require('../services/ApiKeyService');
const adminAuth = require('../middlewares/adminAuth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  
  if (username === process.env.ADMIN_USERNAME && passwordHash === process.env.ADMIN_PASSWORD_HASH) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  
  res.status(401).json({ error: 'Credenziali non valide' });
});

router.post('/api-key', adminAuth, async (req, res) => {
  try {
    const { name, bucket } = req.body;
    
    if (!name || !bucket) {
      return res.status(400).json({ error: 'Nome e Bucket sono obbligatori' });
    }

    const apiKey = await ApiKeyService.createKey(name, bucket);
    res.status(201).json({ apiKey, uploadEndpoint: '/api/files/upload-api' });
  } catch (error) {
    res.status(500).json({ error: 'Impossibile generare la API key' });
  }
});

module.exports = router;