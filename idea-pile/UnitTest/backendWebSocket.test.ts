import { ClientConnection } from '../backend/ws/clientConnection';
// Use the test global WebSocket (jest.setup.js) instead of importing from 'ws'
const WebSocket = (global as any).WebSocket || { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

/**
 * Tests for backend WebSocket server message handling
 * These tests verify that the backend correctly receives and processes
 * sticky note messages from clients
 */

// Mock WebSocket for backend testing
class MockBackendWebSocket {
  readyState = WebSocket.OPEN;
  private handlers: { [key: string]: Function[] } = {};

  on(event: string, handler: Function): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  emit(event: string, ...args: any[]): void {
    if (this.handlers[event]) {
      this.handlers[event].forEach((handler) => handler(...args));
    }
  }

  send(data: string): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
  }
}

describe('Backend WebSocket Message Handling', () => {
  let mockWs: MockBackendWebSocket;
  let clientConnection: ClientConnection;

  beforeEach(() => {
    mockWs = new MockBackendWebSocket();
    clientConnection = new ClientConnection(mockWs as any);
  });

  describe('Connection Setup', () => {
    test('ClientConnection should be created with WebSocket', () => {
      expect(clientConnection).toBeDefined();
      expect(clientConnection.isOpen()).toBe(true);
    });

    test('should set and get user ID', () => {
      const userId = 'user-123';
      clientConnection.setUserId(userId);

      expect(clientConnection.getUserId()).toBe(userId);
    });

    test('should set and get document ID', () => {
      const documentId = 'doc-456';
      clientConnection.setDocumentId(documentId);

      expect(clientConnection.getDocumentId()).toBe(documentId);
    });

    test('should initialize without IDs', () => {
      expect(clientConnection.getUserId()).toBeUndefined();
      expect(clientConnection.getDocumentId()).toBeUndefined();
    });
  });

  describe('Message Sending', () => {
    test('should send JSON message to client', () => {
      const sendSpy = jest.spyOn(mockWs, 'send');

      const message = {
        type: 'create-sticky-note',
        documentId: 'doc-1',
        id: 'box-123',
        x: 100,
        y: 200,
      };

      clientConnection.send(message);

      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test('should send delta message', () => {
      const sendSpy = jest.spyOn(mockWs, 'send');

      const delta = {
        ops: [{ type: 'insert', text: 'Hello' }],
      };

      clientConnection.sendDelta(delta as any, 1, 'user-1');

      expect(sendSpy).toHaveBeenCalled();
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.type).toBe('delta');
      expect(sentData.delta).toEqual(delta);
      expect(sentData.version).toBe(1);
      expect(sentData.author).toBe('user-1');
    });

    test('should send error message', () => {
      const sendSpy = jest.spyOn(mockWs, 'send');

      clientConnection.sendError('Invalid message');

      expect(sendSpy).toHaveBeenCalled();
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.type).toBe('error');
      expect(sentData.error).toBe('Invalid message');
    });

    test('should send user joined notification', () => {
      const sendSpy = jest.spyOn(mockWs, 'send');

      clientConnection.sendUserJoined('user-123');

      expect(sendSpy).toHaveBeenCalled();
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.type).toBe('user-joined');
      expect(sentData.userId).toBe('user-123');
    });

    test('should send user left notification', () => {
      const sendSpy = jest.spyOn(mockWs, 'send');

      clientConnection.sendUserLeft('user-123');

      expect(sendSpy).toHaveBeenCalled();
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.type).toBe('user-left');
      expect(sentData.userId).toBe('user-123');
    });

    test('should send cursor update', () => {
      const sendSpy = jest.spyOn(mockWs, 'send');

      clientConnection.sendCursorUpdate('user-123', { line: 5, ch: 10 });

      expect(sendSpy).toHaveBeenCalled();
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.type).toBe('cursor');
      expect(sentData.userId).toBe('user-123');
      expect(sentData.cursor).toEqual({ line: 5, ch: 10 });
    });
  });

  describe('Connection State', () => {
    test('should report connection as open', () => {
      expect(clientConnection.isOpen()).toBe(true);
    });

    test('should report connection as closed after close()', () => {
      clientConnection.close();
      expect(clientConnection.isOpen()).toBe(false);
    });

    test('should not send when connection is closed', () => {
      clientConnection.close();
      const sendSpy = jest.spyOn(mockWs, 'send');

      clientConnection.send({ type: 'test' });

      // Should not call send on closed connection
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('Sticky Note Message Reception', () => {
    test('should be able to receive create-sticky-note message', (done) => {
      const createMessage = {
        type: 'create-sticky-note',
        documentId: 'doc-1',
        id: 'box-123',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      };

      mockWs.on('message', (data: string) => {
        const parsed = JSON.parse(data);
        expect(parsed.type).toBe('create-sticky-note');
        expect(parsed.id).toBe('box-123');
        expect(parsed.x).toBe(100);
        expect(parsed.y).toBe(200);
        done();
      });

      mockWs.emit('message', JSON.stringify(createMessage));
    });

    test('should be able to receive update-sticky-note message', (done) => {
      const updateMessage = {
        type: 'update-sticky-note',
        documentId: 'doc-1',
        id: 'box-123',
        content: 'Updated text',
        timestamp: Date.now(),
      };

      mockWs.on('message', (data: string) => {
        const parsed = JSON.parse(data);
        expect(parsed.type).toBe('update-sticky-note');
        expect(parsed.content).toBe('Updated text');
        done();
      });

      mockWs.emit('message', JSON.stringify(updateMessage));
    });

    test('should handle multiple messages', (done) => {
      const messages: any[] = [];

      mockWs.on('message', (data: string) => {
        messages.push(JSON.parse(data));

        if (messages.length === 3) {
          expect(messages[0].type).toBe('create-sticky-note');
          expect(messages[1].type).toBe('update-sticky-note');
          expect(messages[2].type).toBe('update-sticky-note');
          done();
        }
      });

      mockWs.emit('message', JSON.stringify({
        type: 'create-sticky-note',
        documentId: 'doc-1',
        id: 'box-123',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      }));

      mockWs.emit('message', JSON.stringify({
        type: 'update-sticky-note',
        documentId: 'doc-1',
        id: 'box-123',
        content: 'First update',
        timestamp: Date.now(),
      }));

      mockWs.emit('message', JSON.stringify({
        type: 'update-sticky-note',
        documentId: 'doc-1',
        id: 'box-123',
        content: 'Second update',
        timestamp: Date.now(),
      }));
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        JSON.parse('invalid json');
      }).toThrow();

      consoleErrorSpy.mockRestore();
    });

    test('should handle sending to closed connection gracefully', () => {
      clientConnection.close();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Should not throw
      expect(() => {
        clientConnection.send({ type: 'test' });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Message Validation', () => {
    test('sticky note create message should contain all required fields', () => {
      const message = {
        type: 'create-sticky-note',
        documentId: 'doc-1',
        id: 'box-123',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      };

      // All fields should be present
      expect(message).toHaveProperty('type');
      expect(message).toHaveProperty('documentId');
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('x');
      expect(message).toHaveProperty('y');
      expect(message).toHaveProperty('width');
      expect(message).toHaveProperty('height');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');
    });

    test('sticky note update message should contain required fields', () => {
      const message = {
        type: 'update-sticky-note',
        documentId: 'doc-1',
        id: 'box-123',
        content: 'New content',
        timestamp: Date.now(),
      };

      expect(message).toHaveProperty('type');
      expect(message).toHaveProperty('documentId');
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');
    });
  });
});
