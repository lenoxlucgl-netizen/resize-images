require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes registration
const storageRoutes = require('./Routes/storage.routes');
const authRoutes = require('./Routes/auth.routes');
const bucketRoutes = require('./Routes/bucket.routes');
const resizeRoutes = require('./Routes/resize.routes');
const adminRoutes = require('./Routes/admin.routes');

app.use('/api/files', storageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/buckets', bucketRoutes);
app.use('/api/resize', resizeRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});