import sqlite3 from "sqlite3";
import bcrypt from "bcrypt"
import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const SALT_ROUNDS = 12;
const mongoose = require('mongoose');

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

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "whiteboards",
    });
  }
}


module.exports =
  mongoose.models.DocumentVersion ||
  mongoose.model("DocumentVersion", DocumentVersionSchema);

export async function run(){
  
  const exists = await db
    .listCollections({ name: "test_collection" })
    .toArray();

  if (exists.length === 0) {
    await db.createCollection("test_collection");
    console.log("test_collection created");
  } else {
    console.log("test_collection already exists");
  }
  await client.close();
}
export default db;
