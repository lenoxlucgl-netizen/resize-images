const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ApiKeyService = require('../services/ApiKeyService');
const db = require('../config/db');

router.post('/api-key', async (req, res) => {
  try {
    const { name } = req.body;
    let { bucket } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome API obbligatorio' });
    }
    
    bucket = bucket || '*'; // * = nessun limite

    const apiKey = await ApiKeyService.createKey(name, bucket);
    res.status(201).json({ apiKey, uploadEndpoint: '/api/files/upload-api' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile generare la API key' });
  }
});

router.get('/api-keys', async (req, res) => {
  try {
    const keys = await ApiKeyService.readKeys();
    res.json({ keys });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile leggere le API key' });
  }
});

router.delete('/api-key/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const deleted = await ApiKeyService.deleteKey(hash);
    if (!deleted) {
      return res.status(404).json({ error: 'Chiave non trovata' });
    }
    res.json({ message: 'Chiave eliminata' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile eliminare la chiave' });
  }
});

module.exports = router;