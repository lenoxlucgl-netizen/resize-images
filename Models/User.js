const pool = require('../config/database');
const bcrypt = require('bcryptjs'); // Aggiungi bcryptjs a package.json

class User {
  static async create({ email, password, role = 'user' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const res = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, role]
    );
    return res.rows[0];
  }

  static async findByCredentials(email, password) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = res.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new Error('Invalid credentials');
    }
    return user;
  }
}

module.exports = User;