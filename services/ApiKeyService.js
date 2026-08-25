const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const keyFile = path.join(__dirname, '..', 'api-keys.json');

class ApiKeyService {
  static async readKeys() {
    try {
      return JSON.parse(await fs.readFile(keyFile, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  static async createKey() {
    const plainKey = `imgf_${crypto.randomBytes(32).toString('hex')}`;
    const keys = await this.readKeys();
    keys.push({ hash: this.hash(plainKey), createdAt: new Date().toISOString() });
    await fs.writeFile(keyFile, JSON.stringify(keys, null, 2));
    return plainKey;
  }

  static async isValid(plainKey) {
    if (!plainKey) return false;
    const keys = await this.readKeys();
    const hash = this.hash(plainKey);
    return keys.some(key => crypto.timingSafeEqual(Buffer.from(key.hash), Buffer.from(hash)));
  }

  static hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}

module.exports = ApiKeyService;