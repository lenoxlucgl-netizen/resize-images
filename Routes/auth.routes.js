const express = require('express');
const router = express.Router();
const ApiKeyService = require('../services/ApiKeyService');

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - TO BE IMPLEMENTED' });
});

router.post('/api-key', async (req, res) => {
  try {
    const apiKey = await ApiKeyService.createKey();
    res.status(201).json({ apiKey, uploadEndpoint: '/api/files/upload-api' });
  } catch (error) {
    res.status(500).json({ error: 'Impossibile generare la API key' });
  }
});

module.exports = router;