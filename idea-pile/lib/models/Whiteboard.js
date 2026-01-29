// lib/models/Whiteboard.js
// Mongoose schema for whiteboard storage
// Defines the structure and validation rules for whiteboard documents

import mongoose from 'mongoose';

const whiteboardSchema = new mongoose.Schema({
  // Unique identifier for each whiteboard (UUID)
  // Used in URLs and for direct whiteboard access
  whiteboardId: {
    type: String,
    required: true,
    unique: true,
    index: true // Index for fast lookups by whiteboard ID
  },
  
  // User who owns this whiteboard
  // Links whiteboard to a specific user account
  userId: {
    type: String,
    required: true,
    index: true // Index for fast queries of user's whiteboards
  },
  
  // Human-readable name for the whiteboard
  title: {
    type: String,
    default: 'Untitled Whiteboard'
  },
  
  // Array of drawing elements (paths, shapes, text, etc.)
  // Each element represents a single drawing object on the canvas
  elements: [{
    id: String, // Unique identifier for this element
    
    // Type of drawing element - determines how to render it
    type: {
      type: String,
      enum: ['path', 'shape', 'text', 'image'] // Supported element types
    },
    
    // For freehand drawing paths - array of [x,y] coordinate pairs
    // Stored as nested arrays for space efficiency: [[x1,y1], [x2,y2], ...]
    points: [[Number]],
    
    // For geometric shapes - defines rectangle/circle boundaries
    bounds: {
      x: Number,      // Left edge
      y: Number,      // Top edge  
      width: Number,  // Width of shape
      height: Number  // Height of shape
    },
    
    // For text and images - single point positioning
    position: {
      x: Number, // X coordinate
      y: Number  // Y coordinate
    },
    
    content: String, // Text content for text elements
    shape: String,   // Shape type: 'rectangle', 'circle', 'line', etc.
    
    // Visual styling properties for the element
    style: {
      stroke: String,       // Border color (hex code)
      strokeWidth: Number,  // Border thickness in pixels
      fill: String,         // Fill color (hex code)
      fontSize: Number,     // Text size for text elements
      fontFamily: String,   // Font family for text elements
      color: String         // Text color for text elements
    },
    
    // Timestamp when element was created (for ordering/versioning)
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Canvas/viewport settings - defines the drawing area
  canvas: {
    width: { type: Number, default: 1920 },           // Canvas width in pixels
    height: { type: Number, default: 1080 },          // Canvas height in pixels
    backgroundColor: { type: String, default: '#ffffff' }, // Background color
    zoom: { type: Number, default: 1.0 },             // Zoom level (1.0 = 100%)
    panX: { type: Number, default: 0 },               // Horizontal pan offset
    panY: { type: Number, default: 0 }                // Vertical pan offset
  },
  
  // Version number - incremented on each save for conflict resolution
  version: {
    type: Number,
    default: 1
  },
  
  // Whether whiteboard can be viewed by anyone (future feature)
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Array of user IDs who can collaborate on this whiteboard (future feature)
  collaborators: [String]
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Database indexes for performance optimization
// Compound index for getting user's whiteboards sorted by most recent
//whiteboardSchema.index({ userId: 1, updatedAt: -1 });
// Single field index for direct whiteboard lookups
//whiteboardSchema.index({ whiteboardId: 1 });

// Export the model, reusing existing model if already compiled (prevents re-compilation errors)
export default mongoose.models.Whiteboard || mongoose.model('Whiteboard', whiteboardSchema);