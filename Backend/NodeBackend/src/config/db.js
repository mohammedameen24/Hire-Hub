const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  try {
    // FIX 1 — production-grade connection options
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,  // fail fast if Atlas unreachable
      socketTimeoutMS: 45000,           // abort slow queries after 45s
      maxPoolSize: 10,                  // max concurrent connections
      minPoolSize: 2,                   // keep warm connections alive
      connectTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // FIX 15 — connection event handlers for production resilience
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — Mongoose will auto-reconnect');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
