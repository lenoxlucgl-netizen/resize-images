const pool = require('../config/database');

class EventLog {
  static async create({ event_name, payload }) {
    const res = await pool.query(
      'INSERT INTO event_logs (event_name, payload) VALUES ($1, $2) RETURNING *',
      [event_name, JSON.stringify(payload)]
    );
    return res.rows[0];
  }

  static async findAll({ limit, order }) {
    let query = 'SELECT * FROM event_logs';
    const values = [];
    let paramIndex = 1;

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

module.exports = EventLog;