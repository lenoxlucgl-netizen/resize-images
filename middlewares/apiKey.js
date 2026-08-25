const ApiKeyService = require('../services/ApiKeyService');

module.exports = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!(await ApiKeyService.isValid(apiKey))) {
      return res.status(401).json({ error: 'API key mancante o non valida' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Impossibile verificare la API key' });
  }
};