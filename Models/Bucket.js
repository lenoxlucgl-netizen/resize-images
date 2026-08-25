const pool = require('../config/database');

class Bucket {
  static async create({ name, owner_id, isPublic = false }) {
    const res = await pool.query(
      'INSERT INTO buckets (name, owner_id, is_public) VALUES ($1, $2, $3) RETURNING *',
      [name, owner_id, isPublic]
    );
    return res.rows[0];
  }

  static async findAll({ where }) {
    let query = 'SELECT * FROM buckets';
    const values = [];
    
    if (where && where.owner_id) {
      query += ' WHERE owner_id = $1';
      values.push(where.owner_id);
    }
    
    const res = await pool.query(query, values);
    return res.rows;
  }
}

module.exports = Bucket;