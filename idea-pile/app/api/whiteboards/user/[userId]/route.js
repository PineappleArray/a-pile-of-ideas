// app/api/whiteboards/user/[userId]/route.js
// API endpoint for retrieving all whiteboards belonging to a specific user
// Handles GET requests to /api/whiteboards/user/[userId]

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Whiteboard from '@/lib/models/Whiteboard';

/**
 * GET /api/whiteboards/user/[userId]
 * Retrieves all whiteboards for a specific user
 * Returns lightweight list without full element data for performance
 */
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Query for user's whiteboards with optimized field selection
    const whiteboards = await Whiteboard.find({ 
      userId: params.userId 
    })
    // Only return essential fields for listing (not full element data)
    .select('whiteboardId title updatedAt createdAt version')
    // Sort by most recently updated first
    .sort({ updatedAt: -1 })
    // Limit to prevent massive responses (optional)
    .limit(100);
    
    // Return array of user's whiteboards
    return NextResponse.json({
      whiteboards,
      count: whiteboards.length
    });
    
  } catch (error) {
    console.error('Error fetching user whiteboards:', error);
    return NextResponse.json(
      { error: 'Failed to load whiteboards' }, 
      { status: 500 }
    );
  }
}