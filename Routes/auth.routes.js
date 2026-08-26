const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ApiKeyService = require('../services/ApiKeyService');
const adminAuth = require('../middlewares/adminAuth');
const db = require('../config/db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  
  try {
    const [rows] = await db.query('SELECT password FROM admin WHERE username = ?', [username]);
    
    // Supportiamo solo la password hashata in SHA-256.
    if (rows.length > 0 && rows[0].password === passwordHash) {
      const token = crypto.createHmac('sha256', process.env.APP_SECRET || 'fallback_secret').update(username).digest('hex');
      return res.json({ token });
    }
    
    res.status(401).json({ error: 'Credenziali non valide' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
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
    console.error(error);
    res.status(500).json({ error: 'Impossibile generare la API key' });
  }
});

router.get('/api-keys', adminAuth, async (req, res) => {
  try {
    const keys = await ApiKeyService.readKeys();
    // Restituisce i metadati senza esporre le chiavi in chiaro (o in questo caso restituisce record dal db che contengono l'hash e altri metadati)
    res.json({ keys });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile leggere le API key' });
  }
});

router.delete('/api-key/:hash', adminAuth, async (req, res) => {
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