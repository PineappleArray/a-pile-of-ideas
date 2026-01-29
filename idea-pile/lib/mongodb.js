// lib/mongodb.js
// MongoDB connection utility for Next.js applications
// Uses connection caching to prevent multiple connections in serverless environments

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Cache the mongoose connection to prevent multiple connections in serverless functions
// Next.js API routes are stateless, so we need to reuse connections across requests
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes connection to MongoDB with caching
 * Returns existing connection if available, otherwise creates new one
 */
async function connectDB() {
  // Return existing connection if already established
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }
  
  // Wait for connection and cache it
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;