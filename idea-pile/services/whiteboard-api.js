// lib/whiteboard-api.js
// Frontend utility functions for interacting with whiteboard API
// Provides clean interface for React components to save/load whiteboards

/**
 * Client-side API wrapper for whiteboard operations
 * Handles HTTP requests and error formatting
 */
export class WhiteboardAPI {
  
  /**
   * Creates a new empty whiteboard for a user
   * @param {string} userId - ID of the user creating the whiteboard
   * @param {string} [title] - Optional custom title
   * @returns {Promise} Promise with new whiteboard data
   */
  static async createWhiteboard(userId, title) {
    const response = await fetch('/api/whiteboards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create whiteboard');
    }
    
    return response.json();
  }

  /**
   * Saves current whiteboard state to database
   * @param {string} whiteboardId - Unique ID of whiteboard to update
   * @param {Object} data - Whiteboard data (elements, canvas settings, title)
   * @param {Array} data.elements - All drawing elements on the canvas
   * @param {Object} data.canvas - Canvas settings (zoom, pan, background, etc.)
   * @param {string} [data.title] - Optional title update
   * @returns {Promise} Promise with updated whiteboard data
   */
  static async saveWhiteboard(whiteboardId, data) {
    const response = await fetch(`/api/whiteboards/${whiteboardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save whiteboard');
    }
    
    return response.json();
  }

  /**
   * Loads a specific whiteboard by ID
   * @param {string} whiteboardId - Unique ID of whiteboard to load
   * @returns {Promise} Promise with complete whiteboard data
   */
  static async loadWhiteboard(whiteboardId) {
    const response = await fetch(`/api/whiteboards/${whiteboardId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Whiteboard not found');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to load whiteboard');
    }
    
    return response.json();
  }

  /**
   * Gets list of all whiteboards for a user
   * @param {string} userId - ID of user whose whiteboards to retrieve
   * @returns {Promise} Promise with array of user's whiteboards (metadata only)
   */
  static async getUserWhiteboards(userId) {
    const response = await fetch(`/api/whiteboards/user/${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to load whiteboards');
    }
    
    return response.json();
  }

  /**
   * Permanently deletes a whiteboard
   * @param {string} whiteboardId - Unique ID of whiteboard to delete
   * @returns {Promise} Promise with deletion confirmation
   */
  static async deleteWhiteboard(whiteboardId) {
    const response = await fetch(`/api/whiteboards/${whiteboardId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete whiteboard');
    }
    
    return response.json();
  }
}