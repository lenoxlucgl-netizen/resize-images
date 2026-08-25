const pool = require('../config/database');

class ResizeJob {
  static async create({ file_id, target_size, output_path, status = 'queued' }) {
    const res = await pool.query(
      'INSERT INTO resize_jobs (file_id, target_size, output_path, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [file_id, target_size, output_path, status]
    );
    return res.rows[0];
  }

  static async findAll({ where, order, limit }) {
    let query = 'SELECT * FROM resize_jobs';
    const values = [];
    let paramIndex = 1;

    if (where && where.file_id) {
      query += ` WHERE file_id = $${paramIndex}`;
      values.push(where.file_id);
      paramIndex++;
    }

    if (order) {
      query += ` ORDER BY ${order[0][0]} ${order[0][1]}`;
    }

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(limit);
    }

    const res = await pool.query(query, values);
    return res.rows;
  }
}

module.exports = ResizeJob;