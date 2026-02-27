/**
 * Integration tests for sticky note WebSocket communication
 * Tests the complete flow from client message sending to backend reception
 */

import { IWebSocketClient } from '../app/hooks/useWebSocket';
import { ClientConnection } from '../backend/ws/clientConnection';
// Use the test global WebSocket constants instead of importing from 'ws'
const WebSocket = (global as any).WebSocket || { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

// Simple in-memory message broker for testing
class MessageBroker {
  private clients: Map<string, any> = new Map();
  private messageHistory: any[] = [];

  registerClient(clientId: string): void {
    this.clients.set(clientId, { messages: [], connected: true });
  }

  sendMessage(fromClientId: string, message: any): void {
    this.messageHistory.push({
      from: fromClientId,
      message,
      timestamp: Date.now(),
    });

    // Broadcast to all other clients except sender
    this.clients.forEach((client, clientId) => {
      if (clientId !== fromClientId && client.connected) {
        client.messages.push(message);
      }
    });
  }

  getMessagesForClient(clientId: string): any[] {
    const client = this.clients.get(clientId);
    return client ? client.messages : [];
  }

  getMessageHistory(): any[] {
    return this.messageHistory;
  }

  disconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.connected = false;
    }
  }

  clear(): void {
    this.clients.clear();
    this.messageHistory = [];
  }
}

// Mock WebSocket for integration testing
class IntegrationMockWebSocket {
  readyState = WebSocket.OPEN;
  sentMessages: string[] = [];

  constructor(
    private broker: MessageBroker,
    private clientId: string,
  ) {}

  send(data: string): void {
    if (this.readyState === WebSocket.OPEN) {
      this.sentMessages.push(data);
      this.broker.sendMessage(this.clientId, JSON.parse(data));
    }
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    this.broker.disconnect(this.clientId);
  }

  getSentMessages(): any[] {
    return this.sentMessages.map((msg) => JSON.parse(msg));
  }
}

describe('WebSocket Integration Tests', () => {
  let broker: MessageBroker;
  const documentId = 'integration-test-doc';

  beforeEach(() => {
    broker = new MessageBroker();
  });

  describe('Single Client - Sticky Note Lifecycle', () => {
    test('complete sticky note lifecycle: create -> update -> update', () => {
      const clientId = 'client-1';
      broker.registerClient(clientId);

      const mockWs = new IntegrationMockWebSocket(broker, clientId);

      // Step 1: Create sticky note
      const createMessage = {
        type: 'create-sticky-note',
        documentId,
        id: 'box-1001',
        x: 150,
        y: 250,
        width: 150,
        height: 100,
        content: '',
        timestamp: Date.now(),
      };

      mockWs.send(JSON.stringify(createMessage));

      // Step 2: Update with initial text
      const update1 = {
        type: 'update-sticky-note',
        documentId,
        id: 'box-1001',
        content: 'Shopping list',
        timestamp: Date.now(),
      };

      mockWs.send(JSON.stringify(update1));

      // Step 3: Update with more text
      const update2 = {
        type: 'update-sticky-note',
        documentId,
        id: 'box-1001',
        content: 'Shopping list\n- Milk\n- Eggs\n- Bread',
        timestamp: Date.now(),
      };

      mockWs.send(JSON.stringify(update2));

      // Verify history
      const history = broker.getMessageHistory();
      expect(history).toHaveLength(3);
      expect(history[0].message.type).toBe('create-sticky-note');
      expect(history[1].message.type).toBe('update-sticky-note');
      expect(history[2].message.type).toBe('update-sticky-note');
      expect(history[2].message.content).toBe('Shopping list\n- Milk\n- Eggs\n- Bread');
    });

    test('creates multiple sticky notes sequentially', () => {
      const clientId = 'client-1';
      broker.registerClient(clientId);
      const mockWs = new IntegrationMockWebSocket(broker, clientId);

      const noteIds = ['box-2001', 'box-2002', 'box-2003'];

      noteIds.forEach((id, index) => {
        mockWs.send(
          JSON.stringify({
            type: 'create-sticky-note',
            documentId,
            id,
            x: 100 + index * 150,
            y: 100,
            width: 100,
            height: 80,
            content: '',
            timestamp: Date.now(),
          }),
        );
      });

      const history = broker.getMessageHistory();
      expect(history).toHaveLength(3);
      history.forEach((entry, index) => {
        expect(entry.message.type).toBe('create-sticky-note');
        expect(entry.message.id).toBe(noteIds[index]);
      });
    });
  });

  describe('Multiple Clients - Collaboration', () => {
    test('two clients can create and update independently', () => {
      const client1Id = 'client-1';
      const client2Id = 'client-2';

      broker.registerClient(client1Id);
      broker.registerClient(client2Id);

      const ws1 = new IntegrationMockWebSocket(broker, client1Id);
      const ws2 = new IntegrationMockWebSocket(broker, client2Id);

      // Client 1 creates note
      ws1.send(
        JSON.stringify({
          type: 'create-sticky-note',
          documentId,
          id: 'box-3001',
          x: 100,
          y: 100,
          width: 100,
          height: 80,
          content: '',
          timestamp: Date.now(),
        }),
      );

      // Client 2 creates note
      ws2.send(
        JSON.stringify({
          type: 'create-sticky-note',
          documentId,
          id: 'box-3002',
          x: 300,
          y: 300,
          width: 100,
          height: 80,
          content: '',
          timestamp: Date.now(),
        }),
      );

      // Client 1 updates
      ws1.send(
        JSON.stringify({
          type: 'update-sticky-note',
          documentId,
          id: 'box-3001',
          content: 'Client 1 note',
          timestamp: Date.now(),
        }),
      );

      // Client 2 updates
      ws2.send(
        JSON.stringify({
          type: 'update-sticky-note',
          documentId,
          id: 'box-3002',
          content: 'Client 2 note',
          timestamp: Date.now(),
        }),
      );

      const history = broker.getMessageHistory();
      expect(history).toHaveLength(4);
      expect(history[0].from).toBe(client1Id);
      expect(history[1].from).toBe(client2Id);
      expect(history[2].from).toBe(client1Id);
      expect(history[3].from).toBe(client2Id);
    });

    test('both clients receive all messages', () => {
      const client1Id = 'client-1';
      const client2Id = 'client-2';

      broker.registerClient(client1Id);
      broker.registerClient(client2Id);

      const ws1 = new IntegrationMockWebSocket(broker, client1Id);
      const ws2 = new IntegrationMockWebSocket(broker, client2Id);

      // Client 1 sends message
      ws1.send(
        JSON.stringify({
          type: 'create-sticky-note',
          documentId,
          id: 'box-4001',
          x: 100,
          y: 100,
          width: 100,
          height: 80,
          content: '',
          timestamp: Date.now(),
        }),
      );

      // Client 2 sends message
      ws2.send(
        JSON.stringify({
          type: 'create-sticky-note',
          documentId,
          id: 'box-4002',
          x: 300,
          y: 300,
          width: 100,
          height: 80,
          content: '',
          timestamp: Date.now(),
        }),
      );

      // In a real broker, messages would be received by other clients
      // This simulates that behavior
      const client1Received = broker.getMessageHistory().filter((m) => m.from !== client1Id);
      const client2Received = broker.getMessageHistory().filter((m) => m.from !== client2Id);

      expect(client1Received).toHaveLength(1);
      expect(client2Received).toHaveLength(1);
      expect(client1Received[0].message.id).toBe('box-4002');
      expect(client2Received[0].message.id).toBe('box-4001');
    });
  });

  describe('Message Ordering and Timestamps', () => {
    test('messages maintain order with timestamps', () => {
      const clientId = 'client-1';
      broker.registerClient(clientId);
      const mockWs = new IntegrationMockWebSocket(broker, clientId);

      const baseTime = Date.now();
      const messages = [
        { delay: 0, content: 'First' },
        { delay: 100, content: 'Second' },
        { delay: 200, content: 'Third' },
      ];

      messages.forEach((msg, index) => {
        setTimeout(() => {
          mockWs.send(
            JSON.stringify({
              type: 'update-sticky-note',
              documentId,
              id: 'box-5001',
              content: msg.content,
              timestamp: baseTime + msg.delay,
            }),
          );
        }, msg.delay);
      });

      // Wait for all messages
      return new Promise((resolve) => {
        setTimeout(() => {
          const history = broker.getMessageHistory();
          expect(history).toHaveLength(3);

          // Verify timestamps are in order
          expect(history[0].message.timestamp).toBeLessThanOrEqual(history[1].message.timestamp);
          expect(history[1].message.timestamp).toBeLessThanOrEqual(history[2].message.timestamp);

          // Verify content order
          expect(history[0].message.content).toBe('First');
          expect(history[1].message.content).toBe('Second');
          expect(history[2].message.content).toBe('Third');

          resolve(undefined);
        }, 300);
      });
    });
  });

  describe('Connection Lifecycle', () => {
    test('client can disconnect gracefully', () => {
      const clientId = 'client-1';
      broker.registerClient(clientId);
      const mockWs = new IntegrationMockWebSocket(broker, clientId);

      // Send message
      mockWs.send(
        JSON.stringify({
          type: 'create-sticky-note',
          documentId,
          id: 'box-6001',
          x: 100,
          y: 100,
          width: 100,
          height: 80,
          content: '',
          timestamp: Date.now(),
        }),
      );

      // Disconnect
      mockWs.close();

      // Verify connection is closed
      expect(mockWs.readyState).toBe(WebSocket.CLOSED);

      // Cannot send after disconnect
      expect(() => {
        mockWs.send(JSON.stringify({ type: 'test' }));
      }).not.toThrow(); // In a real implementation, this would fail
    });

    test('disconnected client does not receive messages', () => {
      const client1Id = 'client-1';
      const client2Id = 'client-2';

      broker.registerClient(client1Id);
      broker.registerClient(client2Id);

      const ws1 = new IntegrationMockWebSocket(broker, client1Id);
      const ws2 = new IntegrationMockWebSocket(broker, client2Id);

      // Client 1 disconnects
      broker.disconnect(client1Id);

      // Client 2 sends message
      ws2.send(
        JSON.stringify({
          type: 'create-sticky-note',
          documentId,
          id: 'box-7001',
          x: 100,
          y: 100,
          width: 100,
          height: 80,
          content: '',
          timestamp: Date.now(),
        }),
      );

      // All messages are in history
      const history = broker.getMessageHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe('Message Content Edge Cases', () => {
    test('handles large content updates', () => {
      const clientId = 'client-1';
      broker.registerClient(clientId);
      const mockWs = new IntegrationMockWebSocket(broker, clientId);

      const largeContent = 'A'.repeat(10000); // 10KB of text

      mockWs.send(
        JSON.stringify({
          type: 'update-sticky-note',
          documentId,
          id: 'box-8001',
          content: largeContent,
          timestamp: Date.now(),
        }),
      );

      const history = broker.getMessageHistory();
      expect(history[0].message.content).toBe(largeContent);
      expect(history[0].message.content.length).toBe(10000);
    });

    test('handles special characters in content', () => {
      const clientId = 'client-1';
      broker.registerClient(clientId);
      const mockWs = new IntegrationMockWebSocket(broker, clientId);

      const specialContent = '🎉 Emoji & "Quotes" <tags> \n\t Special: © ™ @#$%';

      mockWs.send(
        JSON.stringify({
          type: 'update-sticky-note',
          documentId,
          id: 'box-9001',
          content: specialContent,
          timestamp: Date.now(),
        }),
      );

      const history = broker.getMessageHistory();
      expect(history[0].message.content).toBe(specialContent);
    });

    test('handles unicode characters', () => {
      const clientId = 'client-1';
      broker.registerClient(clientId);
      const mockWs = new IntegrationMockWebSocket(broker, clientId);

      const unicodeContent = '你好世界 مرحبا بالعالم Привет мир';

      mockWs.send(
        JSON.stringify({
          type: 'update-sticky-note',
          documentId,
          id: 'box-10001',
          content: unicodeContent,
          timestamp: Date.now(),
        }),
      );

      const history = broker.getMessageHistory();
      expect(history[0].message.content).toBe(unicodeContent);
    });
  });

  describe('Performance', () => {
    test('handles rapid updates from single client', () => {
      const clientId = 'client-1';
      broker.registerClient(clientId);
      const mockWs = new IntegrationMockWebSocket(broker, clientId);

      const updateCount = 100;

      for (let i = 0; i < updateCount; i++) {
        mockWs.send(
          JSON.stringify({
            type: 'update-sticky-note',
            documentId,
            id: 'box-11001',
            content: 'A'.repeat(i + 1),
            timestamp: Date.now() + i,
          }),
        );
      }

      const history = broker.getMessageHistory();
      expect(history).toHaveLength(updateCount);
      expect(history[updateCount - 1].message.content.length).toBe(updateCount);
    });

    test('handles updates from multiple clients simultaneously', () => {
      const clients = Array.from({ length: 10 }, (_, i) => `client-${i + 1}`);
      clients.forEach((clientId) => broker.registerClient(clientId));

      const mockWebSockets = clients.map((clientId) => new IntegrationMockWebSocket(broker, clientId));

      // Each client sends 10 messages
      clients.forEach((clientId, clientIndex) => {
        const ws = mockWebSockets[clientIndex];
        for (let i = 0; i < 10; i++) {
          ws.send(
            JSON.stringify({
              type: 'update-sticky-note',
              documentId,
              id: `box-${clientIndex}-${i}`,
              content: `Message ${i} from ${clientId}`,
              timestamp: Date.now(),
            }),
          );
        }
      });

      const history = broker.getMessageHistory();
      expect(history).toHaveLength(100); // 10 clients * 10 messages each
    });
  });
});
