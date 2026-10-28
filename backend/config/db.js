require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

module.exports = async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
};