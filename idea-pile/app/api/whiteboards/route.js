// app/api/whiteboards/route.js
// API endpoints for creating new whiteboards and listing user whiteboards
// Handles POST requests to /api/whiteboards

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Whiteboard from '@/lib/models/Whiteboard';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/whiteboards
 * Creates a new empty whiteboard for a user
 * 
 * Request body:
 * {
 *   userId: string,     // Required - ID of user creating whiteboard
 *   title?: string      // Optional - custom title for whiteboard
 * }
 */
export async function POST(request) {
  try {
    // Ensure database connection is established
    await connectDB();
    
    // Parse the request body to get user data
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' }, 
        { status: 400 }
      );
    }
    
    // Create new whiteboard document
    const whiteboard = new Whiteboard({
      whiteboardId: uuidv4(), // Generate unique ID for this whiteboard
      userId: body.userId,
      title: body.title || 'Untitled Whiteboard',
      elements: [], // Start with empty canvas
      canvas: {
        // Default canvas settings
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        zoom: 1.0,
        panX: 0,
        panY: 0
      }
    });
    
    // Save to database
    await whiteboard.save();
    
    // Return the created whiteboard with 201 Created status
    return NextResponse.json(whiteboard, { status: 201 });
    
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    
    // Handle duplicate whiteboardId (very unlikely with UUID but possible)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Whiteboard ID conflict, please try again' }, 
        { status: 409 }
      );
    }
    
    // Return generic error for other database issues
    return NextResponse.json(
      { error: 'Failed to create whiteboard' }, 
      { status: 500 }
    );
  }
}