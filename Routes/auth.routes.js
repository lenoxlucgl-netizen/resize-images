const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ApiKeyService = require('../services/ApiKeyService');
const adminAuth = require('../middlewares/adminAuth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  
  if (username === process.env.ADMIN_USERNAME && passwordHash === process.env.ADMIN_PASSWORD_HASH) {
    const token = crypto.createHmac('sha256', process.env.APP_SECRET || 'fallback_secret').update(username).digest('hex');
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

router.get('/api-keys', adminAuth, async (req, res) => {
  try {
    const keys = await ApiKeyService.readKeys();
    // Restituisce i metadati senza esporre le chiavi in chiaro
    res.json({ keys });
  } catch (error) {
    res.status(500).json({ error: 'Impossibile leggere le API key' });
  }
});

router.delete('/api-key/:hash', adminAuth, async (req, res) => {
  try {
    const { hash } = req.params;
    const keys = await ApiKeyService.readKeys();
    const index = keys.findIndex(k => k.hash === hash);
    if (index === -1) {
      return res.status(404).json({ error: 'Chiave non trovata' });
    }
    keys.splice(index, 1);
    const fs = require('fs/promises');
    const path = require('path');
    const keyFile = path.join(__dirname, '..', 'api-keys.json');
    const tmp = `${keyFile}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(keys, null, 2));
    await fs.rename(tmp, keyFile);
    res.json({ message: 'Chiave eliminata' });
  } catch (error) {
    res.status(500).json({ error: 'Impossibile eliminare la chiave' });
  }
});

module.exports = router;