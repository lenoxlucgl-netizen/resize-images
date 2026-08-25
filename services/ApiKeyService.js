const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const keyFile = path.join(__dirname, '..', 'api-keys.json');

class ApiKeyService {
  static async readKeys() {
    try {
      const keys = JSON.parse(await fs.readFile(keyFile, 'utf8'));
      return Array.isArray(keys) ? keys : [];
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  static async createKey() {
    const plainKey = `imgf_${crypto.randomBytes(32).toString('hex')}`;
    const keys = await this.readKeys();
    keys.push({ apiKey: plainKey, hash: this.hash(plainKey), createdAt: new Date().toISOString() });
    const temporaryFile = `${keyFile}.tmp`;
    await fs.writeFile(temporaryFile, JSON.stringify(keys, null, 2));
    await fs.rename(temporaryFile, keyFile);
    return plainKey;
  }

  static async isValid(plainKey) {
    if (!plainKey) return false;
    const keys = await this.readKeys();
    const hash = this.hash(plainKey);
    return keys.some(key => {
      const storedHash = typeof key.hash === 'string' ? key.hash : this.hash(key.apiKey || '');
      return storedHash.length === hash.length && crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(hash));
    });
  }

  static hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}

module.exports = ApiKeyService;