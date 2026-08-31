const crypto = require('crypto');

class SecurityService {
  static getSecret() {
    return process.env.URL_SIGN_SECRET || 'default_secret_for_signing_urls_change_me';
  }

  static generateSignature(uuid) {
    const hmac = crypto.createHmac('sha256', this.getSecret());
    hmac.update(uuid);
    return hmac.digest('hex');
  }

  static verifySignature(uuid, signature) {
    if (!signature) return false;
    const expected = this.generateSignature(uuid);
    
    // Convertiamo le stringhe in buffer per il confronto timing-safe
    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.alloc(expectedBuffer.length);
    
    try {
      signatureBuffer.write(signature, 'hex');
      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (e) {
      return false; // Se la lunghezza o il formato non coincidono
    }
  }
}

module.exports = SecurityService;
