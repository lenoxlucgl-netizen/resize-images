require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

const PORT = process.env.PORT || 3003;
const path = require('path');

app.use(helmet({
  contentSecurityPolicy: {
    directives: { scriptSrc: ["'self'", "'unsafe-inline'"] }
  }
}));
app.use(cors());
app.use(express.json());
app.use('/saved-images', express.static(path.join(__dirname, 'saved-images')));
app.get('/', (req, res) => {
  res.type('html').sendFile(path.join(__dirname, 'public', 'index.php'));
});

// Rotte
const storageRoutes = require('./Routes/storage.routes');
const authRoutes = require('./Routes/auth.routes');

app.use('/api/files', storageRoutes);
app.use('/api/auth', authRoutes);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});