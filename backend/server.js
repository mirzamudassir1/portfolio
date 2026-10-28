require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/islands', require('./routes/islands'));
app.use('/api/contact', require('./routes/contact'));

// Serve the frontend
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => app.listen(PORT, () => console.log(`Open http://localhost:${PORT}`)))
    .catch((err) => console.error('MongoDB error:', err.message));