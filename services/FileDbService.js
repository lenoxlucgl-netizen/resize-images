const pool = require('../config/db');

class FileDbService {
  static async registerFile({ uuid, bucket, fileKey, isPublic, ownerApiKey }) {
    const query = `
      INSERT INTO files (uuid, bucket, file_key, is_public, owner_api_key) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(query, [uuid, bucket, fileKey, isPublic ? 1 : 0, ownerApiKey]);
  }

  static async getFile(uuid) {
    const [rows] = await pool.query('SELECT * FROM files WHERE uuid = ?', [uuid]);
    return rows.length ? rows[0] : null;
  }

  static async logAccess({ uuid, ipAddress, status }) {
    const query = `
      INSERT INTO access_logs (file_uuid, ip_address, status) 
      VALUES (?, ?, ?)
    `;
    await pool.query(query, [uuid, ipAddress, status]);
  }
}

module.exports = FileDbService;
