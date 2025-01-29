const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    goal: { type: String },
    weight: { type: Number },
    height: { type: Number },
    exerciseFrequency: { type: Number },
    text: { type: String },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    chatId: { type: String, unique: true },
    country: String,
    city: String,
    ip: String,
    lat: { type: Number },
    lon: { type: Number },
    isp: { type: String },
    recommendations: [recommendationSchema] // Store multiple recommendations per user
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
