require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes registration will happen inside app.js or here
// For now, let's keep it simple
const storageRoutes = require('./src/Routes/storage.routes');
const authRoutes = require('./src/Routes/auth.routes');

app.use('/api/files', storageRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});