// app/api/whiteboards/[whiteboardId]/route.js
// API endpoints for individual whiteboard operations
// Handles GET, PUT, DELETE requests to /api/whiteboards/[whiteboardId]

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Whiteboard from '@/lib/models/Whiteboard';

/**
 * GET /api/whiteboards/[whiteboardId]
 * Retrieves a specific whiteboard by its ID
 * Returns complete whiteboard data including all elements
 */
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Find whiteboard by its unique ID
    const whiteboard = await Whiteboard.findOne({ 
      whiteboardId: params.whiteboardId 
    });
    
    // Return 404 if whiteboard doesn't exist
    if (!whiteboard) {
      return NextResponse.json(
        { error: 'Whiteboard not found' }, 
        { status: 404 }
      );
    }
    
    // Return complete whiteboard data
    return NextResponse.json(whiteboard);
    
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    return NextResponse.json(
      { error: 'Failed to load whiteboard' }, 
      { status: 500 }
    );
  }
}

/**
 * PUT /api/whiteboards/[whiteboardId]
 * Updates/saves whiteboard content
 * 
 * Request body should contain:
 * {
 *   elements: Array,    // All drawing elements on the canvas
 *   canvas: Object,     // Canvas settings (zoom, pan, background, etc.)
 *   title?: string      // Optional title update
 * }
 */
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    // Parse the updated whiteboard data
    const body = await request.json();
    
    // Update whiteboard with new data and increment version
    const whiteboard = await Whiteboard.findOneAndUpdate(
      { whiteboardId: params.whiteboardId }, // Find by whiteboard ID
      {
        // Update these fields with new data
        elements: body.elements,
        canvas: body.canvas,
        title: body.title,
        $inc: { version: 1 } // Increment version number for conflict detection
      },
      { 
        new: true,    // Return updated document
        upsert: false // Don't create if doesn't exist
      }
    );
    
    // Return 404 if whiteboard doesn't exist
    if (!whiteboard) {
      return NextResponse.json(
        { error: 'Whiteboard not found' }, 
        { status: 404 }
      );
    }
    
    // Return updated whiteboard
    return NextResponse.json(whiteboard);
    
  } catch (error) {
    console.error('Error updating whiteboard:', error);
    return NextResponse.json(
      { error: 'Failed to save whiteboard' }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whiteboards/[whiteboardId]
 * Permanently removes a whiteboard
 * This action cannot be undone
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    // Remove whiteboard from database
    const result = await Whiteboard.findOneAndDelete({ 
      whiteboardId: params.whiteboardId 
    });
    
    // Return 404 if whiteboard didn't exist
    if (!result) {
      return NextResponse.json(
        { error: 'Whiteboard not found' }, 
        { status: 404 }
      );
    }
    
    // Return success confirmation
    return NextResponse.json({ 
      message: 'Whiteboard deleted successfully',
      deletedId: params.whiteboardId 
    });
    
  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    return NextResponse.json(
      { error: 'Failed to delete whiteboard' }, 
      { status: 500 }
    );
  }
}