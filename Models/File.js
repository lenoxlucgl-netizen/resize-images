const pool = require('../config/database');

class File {
  static async create(data) {
    const res = await pool.query(
      `INSERT INTO files (bucket_id, original_name, stored_path, mime_type, size, metadata, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.bucketId, data.originalName, data.storedPath, data.mimeType, data.size, JSON.stringify(data.metadata), data.status || 'pending']
    );
    return res.rows[0];
  }

  static async findById(id) {
    const res = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
    return res.rows[0];
  }

  static async count() {
    const res = await pool.query('SELECT COUNT(*) as count FROM files');
    return parseInt(res.rows[0].count);
  }
}

module.exports = File;