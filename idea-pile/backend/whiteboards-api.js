import sqlite3 from "sqlite3";
import bcrypt from "bcrypt"
import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const SALT_ROUNDS = 12;

// Open (or create) database file
const db = new mongoose.Connection('whiteboards.db');

const mongoose = require('mongoose');

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

const DocumentVersionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  petals: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Petal',
  },
  referenceVersion: {
    type: Number,
    required: function() { return this.type === 'delta'; }
  },
  data: Buffer,  // For keyframes
  delta: {
    
  }, // For deltas
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const USERSCHEMA = new mongoose.Schema({
  // Optional: Let MongoDB generate _id, don't use custom id
  // _id is created automatically as ObjectId
  
  name: { 
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: { 
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    select: false,  // Don't return in queries
    minlength: [8, 'Password must be at least 8 characters']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
}, { 
  timestamps: true  // Adds createdAt and updatedAt
});

// Indexes
USERSCHEMA.index({ email: 1 }, { unique: true });
USERSCHEMA.index({ createdAt: -1 });

// Virtual for id (if you want to use id instead of _id)
USERSCHEMA.virtual('id').get(function() {
  return this._id.toHexString();
});

const User = mongoose.model('User', USERSCHEMA);

module.exports = User;

export const DocumentVersion =
  mongoose.model("DocumentVersion", DocumentVersionSchema);


async function create_user(password, name, email){
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  db.useDb
  db.run(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, hash]
  );
}

async function user_login(password, email){
  db.run("SELECT password_hash FROM users WHERE email = ?", [email], 
    async (err, row) => {
      if (!row) {
        console.log("Invalid credentials");
        return;
      }

      const isValid = await bcrypt.compare(
        password,
        row.password_hash
      );

    if(isValid) {
      console.log("Login success");
    } else {
      console.log("Invalid credentials");
    }
    return isValid;
  })
  return false;
}

async function init_user(){
    await create_user("password123", "John Doe", "john@example.com");
}

export default db;
