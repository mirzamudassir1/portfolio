require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/islands', require('./routes/islands'));
app.use('/api/contact', require('./routes/contact'));

// Serve the frontend
const frontendDir = path.join(__dirname, '..', 'frontend');
console.log('Serving frontend from:', frontendDir);
console.log('index.html found:', fs.existsSync(path.join(frontendDir, 'index.html')));
app.use(express.static(frontendDir));

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => app.listen(PORT, () => console.log(`Open http://localhost:${PORT}`)))
    .catch((err) => console.error('MongoDB error:', err.message));