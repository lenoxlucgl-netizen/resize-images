const ApiKeyService = require('../services/ApiKeyService');

module.exports = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const keyData = await ApiKeyService.isValid(apiKey);
    
    if (!keyData) {
      return res.status(401).json({ error: 'API key mancante o non valida' });
    }
    
    req.authorizedBucket = keyData.bucket;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Impossibile verificare la API key' });
  }
};