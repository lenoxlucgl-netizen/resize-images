const jwt = require('jsonwebtoken');
const User = require('../Models/User');

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, role } = req.body;
      const user = await User.create({ email, password, role });
      res.status(201).json({ message: 'User registered', userId: user.id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findByCredentials(email, password);
      
      const token = jwt.sign(
        { id: user.id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { id: user.id }, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({ token, refreshToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
}

module.exports = AuthController;