const crypto = require('crypto');
const db = require('../config/db');

class ApiKeyService {
  static async readKeys() {
    try {
      const [rows] = await db.query('SELECT api_keys AS hash, name, bucket, createdAT AS createdAt FROM token');
      return rows;
    } catch (error) {
      console.error('Error reading keys from DB:', error);
      return [];
    }
  }

  static async createKey(name, bucket) {
    const plainKey = `imgf_${crypto.randomBytes(32).toString('hex')}`;
    const hash = this.hash(plainKey);
    
    await db.query(
      'INSERT INTO token (api_keys, name, bucket) VALUES (?, ?, ?)',
      [hash, name, bucket]
    );
    
    return plainKey;
  }

  static async deleteKey(hash) {
    const [result] = await db.query('DELETE FROM token WHERE api_keys = ?', [hash]);
    return result.affectedRows > 0;
  }

  static async isValid(plainKey) {
    if (!plainKey) return null;
    const hash = this.hash(plainKey);
    
    // Check specific hash in DB
    const [rows] = await db.query('SELECT api_keys AS hash, name, bucket, createdAT AS createdAt FROM token WHERE api_keys = ?', [hash]);
    
    const validKey = rows.find(key => {
      const storedHash = key.hash;
      return storedHash.length === hash.length && crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(hash));
    });
    return validKey || null;
  }

  static hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}

module.exports = ApiKeyService;