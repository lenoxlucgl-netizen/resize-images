const crypto = require('crypto');

class SecurityService {
  static getSecret() {
    return process.env.URL_SIGN_SECRET || 'default_secret_for_signing_urls_change_me';
  }

  static generateSignature(uuid, expires = null) {
    const hmac = crypto.createHmac('sha256', this.getSecret());
    const dataToSign = expires ? `${uuid}|${expires}` : uuid;
    hmac.update(dataToSign);
    return hmac.digest('hex');
  }

  static verifySignature(uuid, signature, expires = null) {
    if (!signature) return false;
    const expected = this.generateSignature(uuid, expires);
    
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
