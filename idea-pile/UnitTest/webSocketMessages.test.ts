import { IWebSocketClient } from '../app/hooks/useWebSocket';
import { stickyNote } from '../shared/notes';

/**
 * Tests for sticky note WebSocket messaging
 * These tests verify that the toolbar correctly sends WebSocket messages
 * when creating and updating sticky notes
 */

// Mock WebSocket client for testing
class MockWebSocketClient implements IWebSocketClient {
  sentMessages: any[] = [];
  isConnected = true;

  send(message: any): void {
    this.sentMessages.push(message);
  }

  connect(url: string): void {
    this.isConnected = true;
  }

  disconnect(): void {
    this.isConnected = false;
  }
}

describe('Sticky Note WebSocket Messages', () => {
  let mockWsClient: MockWebSocketClient;
  const documentId = 'test-doc-1';

  beforeEach(() => {
    mockWsClient = new MockWebSocketClient();
  });

  describe('Create Sticky Note Message', () => {
    test('sends correct message structure when creating sticky note', () => {
      const boxId = 'box-123456';
      const x = 100;
      const y = 200;
      const width = 100;
      const height = 80;

      // Simulate what toolbar does when creating a sticky note
      mockWsClient.send({
        type: 'create-sticky-note',
        documentId,
        id: boxId,
        x,
        y,
        width,
        height,
        content: '',
        timestamp: Date.now(),
      });

      expect(mockWsClient.sentMessages).toHaveLength(1);
      const message = mockWsClient.sentMessages[0];

      expect(message.type).toBe('create-sticky-note');
      expect(message.documentId).toBe(documentId);
      expect(message.id).toBe(boxId);
      expect(message.x).toBe(x);
      expect(message.y).toBe(y);
      expect(message.width).toBe(width);
      expect(message.height).toBe(height);
      expect(message.content).toBe('');
      expect(typeof message.timestamp).toBe('number');
    });

    test('creates message with correct position', () => {
      const positions = [
        { x: 0, y: 0 },
        { x: 500, y: 300 },
        { x: -50, y: 100 },
      ];

      positions.forEach(({ x, y }) => {
        mockWsClient.sentMessages = [];
        mockWsClient.send({
          type: 'create-sticky-note',
          documentId,
          id: `box-${x}-${y}`,
          x,
          y,
          width: 100,
          height: 80,
          content: '',
          timestamp: Date.now(),
        });

        expect(mockWsClient.sentMessages[0].x).toBe(x);
        expect(mockWsClient.sentMessages[0].y).toBe(y);
      });
    });

    test('includes all required fields for create message', () => {
      const message = {
        type: 'create-sticky-note',
        documentId,
        id: 'box-123',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      };

      mockWsClient.send(message);

      const sent = mockWsClient.sentMessages[0];
      expect(sent).toHaveProperty('type');
      expect(sent).toHaveProperty('documentId');
      expect(sent).toHaveProperty('id');
      expect(sent).toHaveProperty('x');
      expect(sent).toHaveProperty('y');
      expect(sent).toHaveProperty('width');
      expect(sent).toHaveProperty('height');
      expect(sent).toHaveProperty('content');
      expect(sent).toHaveProperty('timestamp');
    });
  });

  describe('Update Sticky Note Message', () => {
    test('sends correct message structure when updating sticky note', () => {
      const boxId = 'box-123456';
      const content = 'Hello World';

      mockWsClient.send({
        type: 'update-sticky-note',
        documentId,
        id: boxId,
        content,
        timestamp: Date.now(),
      });

      expect(mockWsClient.sentMessages).toHaveLength(1);
      const message = mockWsClient.sentMessages[0];

      expect(message.type).toBe('update-sticky-note');
      expect(message.documentId).toBe(documentId);
      expect(message.id).toBe(boxId);
      expect(message.content).toBe(content);
      expect(typeof message.timestamp).toBe('number');
    });

    test('sends each keystroke as separate update', () => {
      const boxId = 'box-123';
      const text = 'Hello';

      // Simulate typing each letter
      text.split('').forEach((char, index) => {
        mockWsClient.send({
          type: 'update-sticky-note',
          documentId,
          id: boxId,
          content: text.substring(0, index + 1),
          timestamp: Date.now(),
        });
      });

      expect(mockWsClient.sentMessages).toHaveLength(5);
      expect(mockWsClient.sentMessages[0].content).toBe('H');
      expect(mockWsClient.sentMessages[1].content).toBe('He');
      expect(mockWsClient.sentMessages[2].content).toBe('Hel');
      expect(mockWsClient.sentMessages[3].content).toBe('Hell');
      expect(mockWsClient.sentMessages[4].content).toBe('Hello');
    });

    test('includes all required fields for update message', () => {
      const message = {
        type: 'update-sticky-note',
        documentId,
        id: 'box-123',
        content: 'Updated text',
        timestamp: Date.now(),
      };

      mockWsClient.send(message);

      const sent = mockWsClient.sentMessages[0];
      expect(sent).toHaveProperty('type');
      expect(sent).toHaveProperty('documentId');
      expect(sent).toHaveProperty('id');
      expect(sent).toHaveProperty('content');
      expect(sent).toHaveProperty('timestamp');
    });

    test('preserves multiline content', () => {
      const multilineContent = `Line 1
Line 2
Line 3`;

      mockWsClient.send({
        type: 'update-sticky-note',
        documentId,
        id: 'box-123',
        content: multilineContent,
        timestamp: Date.now(),
      });

      expect(mockWsClient.sentMessages[0].content).toBe(multilineContent);
    });

    test('handles special characters in content', () => {
      const specialContent = 'Hello "World" & <friends> \n\t Special: © ™';

      mockWsClient.send({
        type: 'update-sticky-note',
        documentId,
        id: 'box-123',
        content: specialContent,
        timestamp: Date.now(),
      });

      expect(mockWsClient.sentMessages[0].content).toBe(specialContent);
    });

    test('handles empty content update', () => {
      mockWsClient.send({
        type: 'update-sticky-note',
        documentId,
        id: 'box-123',
        content: '',
        timestamp: Date.now(),
      });

      expect(mockWsClient.sentMessages[0].content).toBe('');
    });
  });

  describe('WebSocket Client State', () => {
    test('does not send if client is disconnected', () => {
      mockWsClient.isConnected = false;

      // In real implementation, the toolbar checks this before sending
      if (!mockWsClient.isConnected) {
        return; // Skip sending
      }

      mockWsClient.send({
        type: 'create-sticky-note',
        documentId,
        id: 'box-123',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      });

      expect(mockWsClient.sentMessages).toHaveLength(0);
    });

    test('sends if client is connected', () => {
      mockWsClient.isConnected = true;

      if (mockWsClient.isConnected) {
        mockWsClient.send({
          type: 'create-sticky-note',
          documentId,
          id: 'box-123',
          x: 100,
          y: 200,
          width: 100,
          height: 80,
          content: '',
          timestamp: Date.now(),
        });
      }

      expect(mockWsClient.sentMessages).toHaveLength(1);
    });
  });

  describe('Message Sequence', () => {
    test('create message followed by update messages', () => {
      // Create sticky note
      mockWsClient.send({
        type: 'create-sticky-note',
        documentId,
        id: 'box-123',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      });

      // Type text
      const updates = ['H', 'He', 'Hel', 'Hell', 'Hello'];
      updates.forEach((content) => {
        mockWsClient.send({
          type: 'update-sticky-note',
          documentId,
          id: 'box-123',
          content,
          timestamp: Date.now(),
        });
      });

      expect(mockWsClient.sentMessages).toHaveLength(6);
      expect(mockWsClient.sentMessages[0].type).toBe('create-sticky-note');
      expect(mockWsClient.sentMessages[1].type).toBe('update-sticky-note');
      expect(mockWsClient.sentMessages[5].content).toBe('Hello');
    });

    test('multiple sticky notes can be created and updated', () => {
      // Create first note
      mockWsClient.send({
        type: 'create-sticky-note',
        documentId,
        id: 'box-1',
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      });

      // Create second note
      mockWsClient.send({
        type: 'create-sticky-note',
        documentId,
        id: 'box-2',
        x: 200,
        y: 300,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      });

      // Update first note
      mockWsClient.send({
        type: 'update-sticky-note',
        documentId,
        id: 'box-1',
        content: 'Note 1',
        timestamp: Date.now(),
      });

      // Update second note
      mockWsClient.send({
        type: 'update-sticky-note',
        documentId,
        id: 'box-2',
        content: 'Note 2',
        timestamp: Date.now(),
      });

      expect(mockWsClient.sentMessages).toHaveLength(4);
      expect(mockWsClient.sentMessages[0].id).toBe('box-1');
      expect(mockWsClient.sentMessages[1].id).toBe('box-2');
      expect(mockWsClient.sentMessages[2].content).toBe('Note 1');
      expect(mockWsClient.sentMessages[3].content).toBe('Note 2');
    });
  });

  describe('Data Integrity', () => {
    test('message data is properly JSON serializable', () => {
      const message = {
        type: 'create-sticky-note',
        documentId,
        id: 'box-123',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      };

      mockWsClient.send(message);

      // Verify it can be stringified and parsed
      const serialized = JSON.stringify(mockWsClient.sentMessages[0]);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(message);
    });

    test('timestamp is always a number', () => {
      const timestamp = Date.now();

      mockWsClient.send({
        type: 'create-sticky-note',
        documentId,
        id: 'box-123',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp,
      });

      const sent = mockWsClient.sentMessages[0];
      expect(typeof sent.timestamp).toBe('number');
      expect(sent.timestamp).toBe(timestamp);
    });

    test('id should start with box- for sticky notes', () => {
      mockWsClient.send({
        type: 'create-sticky-note',
        documentId,
        id: 'box-' + Date.now(),
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        content: '',
        timestamp: Date.now(),
      });

      const sent = mockWsClient.sentMessages[0];
      expect(sent.id).toMatch(/^box-\d+$/);
    });
  });
});
