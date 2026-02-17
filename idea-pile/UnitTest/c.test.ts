/**
 * ClientConnection Unit Tests
 * 
 * Tests for WebSocket client connection wrapper
 */

import { ClientConnection } from '../backend/ws/clientConnection';
import { WebSocket } from 'ws';

// ============================================
// MOCK WEBSOCKET
// ============================================

class MockWebSocket {
  public readyState: number = 1; // WebSocket.OPEN
  public sentMessages: string[] = [];
  public closed: boolean = false;
  
  // WebSocket constants
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  send(data: string): void {
    if (this.readyState === MockWebSocket.OPEN) {
      this.sentMessages.push(data);
    } else {
      throw new Error('WebSocket is not open');
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.closed = true;
  }

  // Test helpers
  getLastMessage(): any {
    if (this.sentMessages.length === 0) return null;
    return JSON.parse(this.sentMessages[this.sentMessages.length - 1]);
  }

  getAllMessages(): any[] {
    return this.sentMessages.map(msg => JSON.parse(msg));
  }

  clearMessages(): void {
    this.sentMessages = [];
  }
}

// ============================================
// TESTS
// ============================================

describe('ClientConnection', () => {
  let mockWs: MockWebSocket;
  let connection: ClientConnection;

  beforeEach(() => {
    mockWs = new MockWebSocket();
    connection = new ClientConnection(mockWs as any as WebSocket);
  });

  // ==========================================
  // USER ID MANAGEMENT
  // ==========================================

  describe('User ID Management', () => {
    test('Initially has no user ID', () => {
      expect(connection.getUserId()).toBeUndefined();
    });

    test('Can set user ID', () => {
      connection.setUserId('alice');
      expect(connection.getUserId()).toBe('alice');
    });

    test('Can update user ID', () => {
      connection.setUserId('alice');
      connection.setUserId('bob');
      expect(connection.getUserId()).toBe('bob');
    });

    test('Can set empty string as user ID', () => {
      connection.setUserId('');
      expect(connection.getUserId()).toBe('');
    });
  });

  // ==========================================
  // DOCUMENT ID MANAGEMENT
  // ==========================================

  describe('Document ID Management', () => {
    test('Initially has no document ID', () => {
      expect(connection.getDocumentId()).toBeUndefined();
    });

    test('Can set document ID', () => {
      connection.setDocumentId('doc-1');
      expect(connection.getDocumentId()).toBe('doc-1');
    });

    test('Can update document ID', () => {
      connection.setDocumentId('doc-1');
      connection.setDocumentId('doc-2');
      expect(connection.getDocumentId()).toBe('doc-2');
    });

    test('Can set empty string as document ID', () => {
      connection.setDocumentId('');
      expect(connection.getDocumentId()).toBe('');
    });
  });

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  describe('send()', () => {
    test('Sends message when connection is open', () => {
      const message = { type: 'test', data: 'hello' };
      connection.send(message);

      expect(mockWs.sentMessages).toHaveLength(1);
      expect(mockWs.getLastMessage()).toEqual(message);
    });

    test('Sends multiple messages', () => {
      connection.send({ type: 'msg1' });
      connection.send({ type: 'msg2' });
      connection.send({ type: 'msg3' });

      expect(mockWs.sentMessages).toHaveLength(3);
      expect(mockWs.getAllMessages()).toEqual([
        { type: 'msg1' },
        { type: 'msg2' },
        { type: 'msg3' }
      ]);
    });

    test('Does not send when connection is closed', () => {
      mockWs.readyState = MockWebSocket.CLOSED;
      
      connection.send({ type: 'test' });
      
      expect(mockWs.sentMessages).toHaveLength(0);
    });

    test('Handles objects with nested data', () => {
      const message = {
        type: 'complex',
        data: {
          nested: {
            value: 123
          }
        }
      };
      
      connection.send(message);
      
      expect(mockWs.getLastMessage()).toEqual(message);
    });

    test('Handles arrays in message', () => {
      const message = {
        type: 'array',
        items: [1, 2, 3]
      };
      
      connection.send(message);
      
      expect(mockWs.getLastMessage()).toEqual(message);
    });

    test('Handles null values', () => {
      const message = { type: 'test', value: null };
      
      connection.send(message);
      
      expect(mockWs.getLastMessage()).toEqual(message);
    });
  });

  // ==========================================
  // SEND ERROR
  // ==========================================

  describe('sendError()', () => {
    test('Sends error message', () => {
      connection.sendError('Something went wrong');

      const message = mockWs.getLastMessage();
      expect(message.type).toBe('error');
      expect(message.error).toBe('Something went wrong');
    });

    test('Sends multiple errors', () => {
      connection.sendError('Error 1');
      connection.sendError('Error 2');

      expect(mockWs.sentMessages).toHaveLength(2);
      expect(mockWs.getAllMessages()[0].error).toBe('Error 1');
      expect(mockWs.getAllMessages()[1].error).toBe('Error 2');
    });

    test('Handles empty error message', () => {
      connection.sendError('');

      const message = mockWs.getLastMessage();
      expect(message.type).toBe('error');
      expect(message.error).toBe('');
    });

    test('Does not send error when connection is closed', () => {
      mockWs.readyState = MockWebSocket.CLOSED;
      
      connection.sendError('Error');
      
      expect(mockWs.sentMessages).toHaveLength(0);
    });
  });

  // ==========================================
  // SEND DELTA
  // ==========================================

  describe('sendDelta()', () => {
    test('Sends delta with all fields', () => {
      const delta = {
        ops: [
          { type: 'insert' as const, text: 'Hello' }
        ]
      };

      connection.sendDelta(delta, 5, 'alice');

      const message = mockWs.getLastMessage();
      expect(message.type).toBe('delta');
      expect(message.delta).toEqual(delta);
      expect(message.version).toBe(5);
      expect(message.author).toBe('alice');
    });

    test('Sends complex delta', () => {
      const delta = {
        ops: [
          { type: 'retain' as const, count: 10 },
          { type: 'insert' as const, text: 'Hello' },
          { type: 'delete' as const, count: 5 }
        ]
      };

      connection.sendDelta(delta, 100, 'bob');

      const message = mockWs.getLastMessage();
      expect(message.delta.ops).toHaveLength(3);
      expect(message.version).toBe(100);
      expect(message.author).toBe('bob');
    });

    test('Sends delta with version 0', () => {
      const delta = { ops: [] };
      
      connection.sendDelta(delta, 0, 'carol');

      const message = mockWs.getLastMessage();
      expect(message.version).toBe(0);
    });

    test('Does not send delta when connection is closed', () => {
      mockWs.readyState = MockWebSocket.CLOSED;
      
      connection.sendDelta({ ops: [] }, 1, 'alice');
      
      expect(mockWs.sentMessages).toHaveLength(0);
    });
  });

  // ==========================================
  // SEND USER JOINED
  // ==========================================

  describe('sendUserJoined()', () => {
    test('Sends user joined notification', () => {
      connection.sendUserJoined('bob');

      const message = mockWs.getLastMessage();
      expect(message.type).toBe('user-joined');
      expect(message.userId).toBe('bob');
    });

    test('Sends multiple user joined notifications', () => {
      connection.sendUserJoined('alice');
      connection.sendUserJoined('bob');
      connection.sendUserJoined('carol');

      expect(mockWs.sentMessages).toHaveLength(3);
      expect(mockWs.getAllMessages()[0].userId).toBe('alice');
      expect(mockWs.getAllMessages()[1].userId).toBe('bob');
      expect(mockWs.getAllMessages()[2].userId).toBe('carol');
    });

    test('Does not send when connection is closed', () => {
      mockWs.readyState = MockWebSocket.CLOSED;
      
      connection.sendUserJoined('alice');
      
      expect(mockWs.sentMessages).toHaveLength(0);
    });
  });

  // ==========================================
  // SEND USER LEFT
  // ==========================================

  describe('sendUserLeft()', () => {
    test('Sends user left notification', () => {
      connection.sendUserLeft('alice');

      const message = mockWs.getLastMessage();
      expect(message.type).toBe('user-left');
      expect(message.userId).toBe('alice');
    });

    test('Sends multiple user left notifications', () => {
      connection.sendUserLeft('alice');
      connection.sendUserLeft('bob');

      expect(mockWs.sentMessages).toHaveLength(2);
      expect(mockWs.getAllMessages()[0].userId).toBe('alice');
      expect(mockWs.getAllMessages()[1].userId).toBe('bob');
    });

    test('Does not send when connection is closed', () => {
      mockWs.readyState = MockWebSocket.CLOSED;
      
      connection.sendUserLeft('alice');
      
      expect(mockWs.sentMessages).toHaveLength(0);
    });
  });

  // ==========================================
  // SEND CURSOR UPDATE
  // ==========================================

  describe('sendCursorUpdate()', () => {
    test('Sends cursor update', () => {
      connection.sendCursorUpdate('alice', { line: 5, ch: 10 });

      const message = mockWs.getLastMessage();
      expect(message.type).toBe('cursor');
      expect(message.userId).toBe('alice');
      expect(message.cursor).toEqual({ line: 5, ch: 10 });
    });

    test('Sends cursor at position 0,0', () => {
      connection.sendCursorUpdate('bob', { line: 0, ch: 0 });

      const message = mockWs.getLastMessage();
      expect(message.cursor).toEqual({ line: 0, ch: 0 });
    });

    test('Sends multiple cursor updates', () => {
      connection.sendCursorUpdate('alice', { line: 1, ch: 5 });
      connection.sendCursorUpdate('alice', { line: 2, ch: 10 });
      connection.sendCursorUpdate('alice', { line: 3, ch: 15 });

      expect(mockWs.sentMessages).toHaveLength(3);
    });

    test('Does not send when connection is closed', () => {
      mockWs.readyState = MockWebSocket.CLOSED;
      
      connection.sendCursorUpdate('alice', { line: 1, ch: 1 });
      
      expect(mockWs.sentMessages).toHaveLength(0);
    });
  });

  // ==========================================
  // CONNECTION STATE
  // ==========================================

  describe('Connection State', () => {
    test('isOpen() returns true when connection is open', () => {
      mockWs.readyState = MockWebSocket.OPEN;
      expect(connection.isOpen()).toBe(true);
    });

    test('isOpen() returns false when connection is closed', () => {
      mockWs.readyState = MockWebSocket.CLOSED;
      expect(connection.isOpen()).toBe(false);
    });

    test('isOpen() returns false when connection is connecting', () => {
      mockWs.readyState = MockWebSocket.CONNECTING;
      expect(connection.isOpen()).toBe(false);
    });

    test('isOpen() returns false when connection is closing', () => {
      mockWs.readyState = MockWebSocket.CLOSING;
      expect(connection.isOpen()).toBe(false);
    });
  });

  // ==========================================
  // CLOSE CONNECTION
  // ==========================================

  describe('close()', () => {
    test('Closes open connection', () => {
      connection.close();

      expect(mockWs.closed).toBe(true);
      expect(mockWs.readyState).toBe(MockWebSocket.CLOSED);
    });

    test('Does not throw when closing already closed connection', () => {
      mockWs.readyState = MockWebSocket.CLOSED;
      
      expect(() => connection.close()).not.toThrow();
    });

    test('Cannot send messages after closing', () => {
      connection.close();
      connection.send({ type: 'test' });

      expect(mockWs.sentMessages).toHaveLength(0);
    });

    test('isOpen() returns false after close', () => {
      connection.close();

      expect(connection.isOpen()).toBe(false);
    });
  });

  // ==========================================
  // INTEGRATION SCENARIOS
  // ==========================================

  describe('Integration Scenarios', () => {
    test('Complete user session flow', () => {
      // User joins
      connection.setUserId('alice');
      connection.setDocumentId('doc-1');
      
      // Send initial data
      connection.send({ type: 'init', content: 'Hello' });
      
      // User types
      connection.sendDelta({ ops: [{ type: 'insert' as const, text: '!' }] }, 1, 'alice');
      
      // Another user joins
      connection.sendUserJoined('bob');
      
      // User leaves
      connection.sendUserLeft('bob');
      
      // Close connection
      connection.close();

      expect(mockWs.sentMessages).toHaveLength(4);
      expect(connection.isOpen()).toBe(false);
    });

    test('Handles rapid message sending', () => {
      for (let i = 0; i < 100; i++) {
        connection.send({ type: 'test', count: i });
      }

      expect(mockWs.sentMessages).toHaveLength(100);
      expect(mockWs.getAllMessages()[0].count).toBe(0);
      expect(mockWs.getAllMessages()[99].count).toBe(99);
    });

    test('User and document IDs are independent', () => {
      connection.setUserId('alice');
      connection.setDocumentId('doc-1');

      expect(connection.getUserId()).toBe('alice');
      expect(connection.getDocumentId()).toBe('doc-1');

      connection.setDocumentId('doc-2');

      expect(connection.getUserId()).toBe('alice'); // Unchanged
      expect(connection.getDocumentId()).toBe('doc-2');
    });

    test('Sends all message types', () => {
      connection.send({ type: 'custom' });
      connection.sendError('error');
      connection.sendDelta({ ops: [] }, 1, 'alice');
      connection.sendUserJoined('bob');
      connection.sendUserLeft('carol');
      connection.sendCursorUpdate('dave', { line: 1, ch: 1 });

      expect(mockWs.sentMessages).toHaveLength(6);
      
      const types = mockWs.getAllMessages().map(m => m.type);
      expect(types).toEqual(['custom', 'error', 'delta', 'user-joined', 'user-left', 'cursor']);
    });
  });
});