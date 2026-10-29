const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    label: { type: String, required: true },
    url: { type: String, required: true },
}, { _id: false });

const islandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    x: { type: Number, required: true },
    z: { type: Number, required: true },
    radius: { type: Number, default: 12 },
    color: { type: String, default: '#f4d03f' },
    title: { type: String, required: true },
    lines: [{ type: String }],
    links: [linkSchema],
}, { timestamps: true });

module.exports = mongoose.model('Island', islandSchema);
