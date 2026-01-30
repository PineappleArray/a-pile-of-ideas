import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not defined");

const USERSCHEMA = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true, select: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', USERSCHEMA);

const DocumentVersionSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  versionNumber: { type: Number, required: true },
  petals: { type: mongoose.Schema.Types.ObjectId, ref: 'Petal' },
  createdAt: { type: Date, default: Date.now },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export const DocumentVersion = mongoose.models.DocumentVersion || mongoose.model("DocumentVersion", DocumentVersionSchema);

// Define the type for the cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the globalThis type
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = globalThis.mongoose || { conn: null, promise: null };

if (!globalThis.mongoose) {
  globalThis.mongoose = cached;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: "whiteboards" });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}