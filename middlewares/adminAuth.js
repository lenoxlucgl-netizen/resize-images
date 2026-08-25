const crypto = require('crypto');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autorizzazione mancante o formato non valido' });
  }

  const token = authHeader.split(' ')[1];
  const expectedToken = crypto.createHmac('sha256', process.env.APP_SECRET || 'fallback_secret').update(process.env.ADMIN_USERNAME || 'admin').digest('hex');

  if (token === expectedToken) {
    req.admin = { username: process.env.ADMIN_USERNAME };
    next();
  } else {
    return res.status(403).json({ error: 'Token non valido' });
  }
};
