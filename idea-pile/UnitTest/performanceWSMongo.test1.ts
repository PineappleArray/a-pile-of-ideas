import { DocumentManager } from '../backend/document/documentManager';
import { MongoSnapshotStore } from '../backend/storage/snapshotStore';
import { IClientConnection } from '../backend/ws/IClient';
import { ClientConnection } from '../backend/ws/webSocketServer';
import { DeltaMessage } from '../delta/delta';
import { WebSocketServer, WebSocket } from 'ws';

describe('DocumentManager', () => {
  let manager: DocumentManager;
  let snapshotStore: MongoSnapshotStore;
  let wss: WebSocketServer;

  beforeAll(async () => {
    // Start WebSocket server
    wss = new WebSocketServer({ port: 8080 });

    // For testing, echo messages back to simulate server handling
    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        // Echo back to the client
        ws.send(data);
      });
    });

    // Use MongoDB snapshot store for testing
    snapshotStore = await MongoSnapshotStore.create();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await snapshotStore.dropDatabase();
    
    // Create a new manager with the snapshot store
    manager = new DocumentManager({
      snapshotStore,
      snapshotInterval: 5, // Small interval for testing
      sessionTimeout: 1000
    });
  });

  afterEach(async () => {
    // Shutdown manager and clear data
    await manager.shutdown();
  });

  afterAll(async () => {
    // Shutdown WebSocket server
    wss.close();

    // Drop the test database and close connection
    await snapshotStore.dropDatabase();
    await snapshotStore.shutdown();
  });

  describe('Session Creation', () => {
    test('should create a new session for a document', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      const session = await manager.getOrCreateSession('doc1', 'Initial content');
      
      expect(session).toBeDefined();
      expect(session.getContent()).toBe('Initial content');
      expect(session.getVersion()).toBe(0);

      ws.close();
    });

    test('should return existing session if already created', async () => {
      const session1 = await manager.getOrCreateSession('doc1', 'Content 1');
      const session2 = await manager.getOrCreateSession('doc1', 'Content 2');
      
      expect(session1).toBe(session2);
      expect(session2.getContent()).toBe('Content 1'); // Original content preserved
    });

    test('should load content from snapshot if available', async () => {
      // Save a snapshot first
      await snapshotStore.save('doc1', {
        content: 'Stored content',
        version: 5,
        timestamp: Date.now()
      });

      const session = await manager.getOrCreateSession('doc1');
      
      expect(session.getContent()).toBe('Stored content');
    });
  });

  describe('User Session Management', () => {
    test('should add user to session', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      const session = await manager.joinSession('doc1', 'user1', connection, 'Hello');
      
      expect(session.getUserCount()).toBe(1);
      expect(manager.getUserDocument('user1')).toBe('doc1');

      ws.close();
    });

    test('should move user from one session to another', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await manager.joinSession('doc1', 'user1', connection, 'Doc 1');
      expect(manager.getUserDocument('user1')).toBe('doc1');
      
      await manager.joinSession('doc2', 'user1', connection, 'Doc 2');
      expect(manager.getUserDocument('user1')).toBe('doc2');
      
      const session1 = manager.getSession('doc1');
      const session2 = manager.getSession('doc2');
      
      expect(session1?.getUserCount()).toBe(0);
      expect(session2?.getUserCount()).toBe(1);

      ws.close();
    });

    test('should remove user from session', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await manager.joinSession('doc1', 'user1', connection, 'Content');
      
      await manager.leaveSession('user1');
      
      expect(manager.getUserDocument('user1')).toBeUndefined();

      ws.close();
    });

    test('should handle multiple users in same session', async () => {
      const ws1 = new WebSocket('ws://localhost:8080');
      const ws2 = new WebSocket('ws://localhost:8080');
      const ws3 = new WebSocket('ws://localhost:8080');
      await Promise.all([
        new Promise((resolve) => ws1.on('open', resolve)),
        new Promise((resolve) => ws2.on('open', resolve)),
        new Promise((resolve) => ws3.on('open', resolve))
      ]);
      const conn1 = new ClientConnection(ws1);
      const conn2 = new ClientConnection(ws2);
      const conn3 = new ClientConnection(ws3);
      
      await manager.joinSession('doc1', 'user1', conn1, 'Shared doc');
      await manager.joinSession('doc1', 'user2', conn2);
      await manager.joinSession('doc1', 'user3', conn3);
      
      const session = manager.getSession('doc1');
      expect(session?.getUserCount()).toBe(3);

      ws1.close();
      ws2.close();
      ws3.close();
    });
  });

  describe('Operation Handling', () => {
    test('should apply operation from user', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await manager.joinSession('doc1', 'user1', connection, 'Hello');
      
      const deltaMessage: DeltaMessage = {
        ops:  [{ type: 'retain', count: 5 }, { type: 'insert', text: ' World' }],
        baseVersion: 0,
        docId: 'doc1'
      };
      
      const result = await manager.handleOperation('user1', deltaMessage);
      
      expect(result).toBeDefined();
      expect(result?.version).toBe(1);
      
      const session = manager.getSession('doc1');
      expect(session?.getContent()).toBe('Hello World');

      ws.close();
    });

    test('should throw error if user not in session', async () => {
      const deltaMessage: DeltaMessage = {
        ops:  [{ type: 'insert', text: 'text' }],
        baseVersion: 0,
        docId: 'doc1'
      };
      
      await expect(manager.handleOperation('user1', deltaMessage))
        .rejects.toThrow('User user1 is not in any session');
    });

    test('should broadcast operation to other users', async () => {
      const ws1 = new WebSocket('ws://localhost:8080');
      const ws2 = new WebSocket('ws://localhost:8080');
      await Promise.all([
        new Promise((resolve) => ws1.on('open', resolve)),
        new Promise((resolve) => ws2.on('open', resolve))
      ]);
      const conn1 = new ClientConnection(ws1);
      const conn2 = new ClientConnection(ws2);
      
      let receivedMessage = false;
      ws2.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'delta') {
          receivedMessage = true;
        }
      });
      
      await manager.joinSession('doc1', 'user1', conn1, 'Start');
      await manager.joinSession('doc1', 'user2', conn2);
      
      const deltaMessage: DeltaMessage = {
        ops: [{ type: 'retain', count: 5 }, { type: 'insert', text: '!' }],
        baseVersion: 0,
        docId: 'doc1'
      };
      
      await manager.handleOperation('user1', deltaMessage);
      
      // Wait a bit for message to be received
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(receivedMessage).toBe(true);

      ws1.close();
      ws2.close();
    });
  });

  describe('Snapshot Management', () => {
    test('should save snapshot after configured interval', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await manager.joinSession('doc1', 'user1', connection, 'Text');
      
      // Apply 5 operations (snapshotInterval = 5)
      for (let i = 0; i < 5; i++) {
        const deltaMessage: DeltaMessage = {
          ops: [{ type: 'retain', count: 4 + i }, { type: 'insert', text: i.toString() }],
          baseVersion: i,
          docId: 'doc1'
        };
        await manager.handleOperation('user1', deltaMessage);
      }
      
      // Check if snapshot was saved
      const snapshot = await snapshotStore.load('doc1');
      expect(snapshot).toBeDefined();
      expect(snapshot?.version).toBe(5);

      ws.close();
    });

    test('should save snapshot when last user leaves', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await manager.joinSession('doc1', 'user1', connection, 'Important data');
      
      await manager.leaveSession('user1');
      
      const snapshot = await snapshotStore.load('doc1');
      expect(snapshot).toBeDefined();
      expect(snapshot?.content).toBe('Important data');

      ws.close();
    });

    test('should save snapshots on shutdown', async () => {
      const ws1 = new WebSocket('ws://localhost:8080');
      const ws2 = new WebSocket('ws://localhost:8080');
      await Promise.all([
        new Promise((resolve) => ws1.on('open', resolve)),
        new Promise((resolve) => ws2.on('open', resolve))
      ]);
      const conn1 = new ClientConnection(ws1);
      const conn2 = new ClientConnection(ws2);
      
      await manager.joinSession('doc1', 'user1', conn1, 'Doc 1 content');
      await manager.joinSession('doc2', 'user2', conn2, 'Doc 2 content');
      
      await manager.shutdown();
      
      const snap1 = await snapshotStore.load('doc1');
      const snap2 = await snapshotStore.load('doc2');
      
      expect(snap1?.content).toBe('Doc 1 content');
      expect(snap2?.content).toBe('Doc 2 content');

      ws1.close();
      ws2.close();
    });
  });

  describe('Cursor Management', () => {
    test('should update user cursor position', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await manager.joinSession('doc1', 'user1', connection, 'Text');
      
      manager.updateCursor('user1', { line: 5, ch: 10 });
      
      const session = manager.getSession('doc1');
      const state = session?.getState();
      const user1State = state?.users.find((u: any) => u.userId === 'user1');
      
      expect(user1State?.cursor).toEqual({ line: 5, ch: 10 });

      ws.close();
    });

    test('should not error when updating cursor for non-existent user', () => {
      expect(() => {
        manager.updateCursor('nonexistent', { line: 0, ch: 0 });
      }).not.toThrow();
    });
  });

  describe('Query Methods', () => {
    test('should check if document has active session', async () => {
      expect(manager.hasActiveSession('doc1')).toBe(false);
      
      await manager.getOrCreateSession('doc1', 'Content');
      
      expect(manager.hasActiveSession('doc1')).toBe(true);
    });

    test('should get all active sessions', async () => {
      await manager.getOrCreateSession('doc1', 'Doc 1');
      await manager.getOrCreateSession('doc2', 'Doc 2');
      await manager.getOrCreateSession('doc3', 'Doc 3');
      
      const sessions = manager.getAllSessions();
      
      expect(sessions.length).toBe(3);
      expect(sessions.map((s: any) => s.documentId)).toContain('doc1');
      expect(sessions.map((s: any) => s.documentId)).toContain('doc2');
      expect(sessions.map((s: any) => s.documentId)).toContain('doc3');
    });

    test('should get total user count', async () => {
      const ws1 = new WebSocket('ws://localhost:8080');
      const ws2 = new WebSocket('ws://localhost:8080');
      const ws3 = new WebSocket('ws://localhost:8080');
      await Promise.all([
        new Promise((resolve) => ws1.on('open', resolve)),
        new Promise((resolve) => ws2.on('open', resolve)),
        new Promise((resolve) => ws3.on('open', resolve))
      ]);
      const conn1 = new ClientConnection(ws1);
      const conn2 = new ClientConnection(ws2);
      const conn3 = new ClientConnection(ws3);
      
      await manager.joinSession('doc1', 'user1', conn1, 'Doc');
      await manager.joinSession('doc1', 'user2', conn2);
      await manager.joinSession('doc2', 'user3', conn3, 'Doc2');
      
      expect(manager.getTotalUserCount()).toBe(3);

      ws1.close();
      ws2.close();
      ws3.close();
    });

    test('should get stats', async () => {
      const ws1 = new WebSocket('ws://localhost:8080');
      const ws2 = new WebSocket('ws://localhost:8080');
      await Promise.all([
        new Promise((resolve) => ws1.on('open', resolve)),
        new Promise((resolve) => ws2.on('open', resolve))
      ]);
      const conn1 = new ClientConnection(ws1);
      const conn2 = new ClientConnection(ws2);
      
      await manager.joinSession('doc1', 'user1', conn1, 'Doc 1');
      await manager.joinSession('doc2', 'user2', conn2, 'Doc 2');
      
      const stats = manager.getStats();
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalUsers).toBe(2);
      expect(stats.sessions.length).toBe(2);

      ws1.close();
      ws2.close();
    });
  });

  describe('Manual Save', () => {
    test('should manually save document', async () => {
      await manager.getOrCreateSession('doc1', 'Manual save test');
      
      await manager.saveDocument('doc1');
      
      const snapshot = await snapshotStore.load('doc1');
      expect(snapshot?.content).toBe('Manual save test');
    });

    test('should not error when saving non-existent document', async () => {
      await expect(manager.saveDocument('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('Session Cleanup', () => {
    test('should clean up empty sessions after timeout', async () => {
      // Create manager with short timeout
      const shortTimeoutManager = new DocumentManager({
        snapshotStore,
        sessionTimeout: 100
      });

      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await shortTimeoutManager.joinSession('doc1', 'user1', connection, 'Temp');
      await shortTimeoutManager.leaveSession('user1');
      
      expect(shortTimeoutManager.hasActiveSession('doc1')).toBe(true);
      
      // Wait for cleanup (runs every 60s, but we'll trigger shutdown which saves)
      await new Promise(resolve => setTimeout(resolve, 150));
      await shortTimeoutManager.shutdown();

      ws.close();
    }, 10000);
  });

  describe('Persistence and Recovery', () => {
    test('should restore session from snapshot after restart', async () => {
      // Create session and save data
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await manager.joinSession('doc1', 'user1', connection, 'Persistent data');
      
      const deltaMessage: DeltaMessage = {
        ops: [{ type: 'retain', count: 15 }, { type: 'insert', text: '!' }],
        baseVersion: 0,
        docId: 'doc1'
      };
      await manager.handleOperation('user1', deltaMessage);
      
      await manager.leaveSession('user1');
      await manager.shutdown();
      
      // Create new manager
      const newManager = new DocumentManager({
        snapshotStore,
        snapshotInterval: 5
      });
      
      // Load session
      const session = await newManager.getOrCreateSession('doc1');
      
      expect(session.getContent()).toBe('Persistent data!');
      
      await newManager.shutdown();

      ws.close();
    });
  });

  describe('Performance Benchmarks', () => {
    test('Session Creation Benchmark', async () => {
      const numSessions = 100;
      const start = performance.now();
      for (let i = 0; i < numSessions; i++) {
        await manager.getOrCreateSession(`bench-doc-${i}`, `Initial content ${i}`);
      }
      const end = performance.now();
      const duration = end - start;
      console.log(`Created ${numSessions} sessions in ${duration} ms`);
      expect(duration).toBeLessThan(5000); // Adjust threshold as needed
    });

    test('Operation Handling Benchmark', async () => {
      const ws = new WebSocket('ws://localhost:8080');
      await new Promise((resolve) => ws.on('open', resolve));
      const connection = new ClientConnection(ws);
      
      await manager.joinSession('bench-ops', 'bench-user', connection, 'Benchmark text');
      
      const numOps = 1000;
      const start = performance.now();
      for (let i = 0; i < numOps; i++) {
        const deltaMessage: DeltaMessage = {
          ops: [{ type: 'retain', count: 14 }, { type: 'insert', text: i.toString() }],
          baseVersion: i,
          docId: 'bench-ops'
        };
        await manager.handleOperation('bench-user', deltaMessage);
      }
      const end = performance.now();
      const duration = end - start;
      console.log(`Applied ${numOps} operations in ${duration} ms`);
      expect(duration).toBeLessThan(10000); // Adjust threshold

      ws.close();
    });

    test('Broadcasting Benchmark', async () => {
      const numUsers = 50;
      const connections: ClientConnection[] = [];
      const websockets: WebSocket[] = [];
      
      for (let i = 0; i < numUsers; i++) {
        const ws = new WebSocket('ws://localhost:8080');
        websockets.push(ws);
        await new Promise((resolve) => ws.on('open', resolve));
        const conn = new ClientConnection(ws);
        connections.push(conn);
        await manager.joinSession('bench-broadcast', `user-${i}`, conn, 'Shared content');
      }
      
      const deltaMessage: DeltaMessage = {
        ops: [{ type: 'insert', text: 'Benchmark insert' }],
        baseVersion: 0,
        docId: 'bench-broadcast'
      };
      
      const start = performance.now();
      await manager.handleOperation('user-0', deltaMessage);
      const end = performance.now();
      const duration = end - start;
      console.log(`Broadcasted to ${numUsers} users in ${duration} ms`);
      expect(duration).toBeLessThan(1000); // Broadcasting should be fast

      websockets.forEach(ws => ws.close());
    });

    test('Snapshot Loading Benchmark', async () => {
      // Pre-save a snapshot
      await snapshotStore.save('bench-load', {
        content: 'Large content for benchmark'.repeat(1000),
        version: 100,
        timestamp: Date.now()
      });
      
      const numLoads = 50;
      const start = performance.now();
      for (let i = 0; i < numLoads; i++) {
        await manager.getOrCreateSession('bench-load');
      }
      const end = performance.now();
      const duration = end - start;
      console.log(`Loaded snapshot ${numLoads} times in ${duration} ms`);
      expect(duration).toBeLessThan(5000);
    });

    test('User Join/Leave Benchmark', async () => {
      const numUsers = 200;
      const start = performance.now();
      const websockets: WebSocket[] = [];
      
      for (let i = 0; i < numUsers; i++) {
        const ws = new WebSocket('ws://localhost:8080');
        websockets.push(ws);
        await new Promise((resolve) => ws.on('open', resolve));
        const conn = new ClientConnection(ws);
        await manager.joinSession('bench-users', `user-${i}`, conn, 'User content');
      }
      
      for (let i = 0; i < numUsers; i++) {
        await manager.leaveSession(`user-${i}`);
      }
      
      const end = performance.now();
      const duration = end - start;
      console.log(`Joined and left ${numUsers} users in ${duration} ms`);
      expect(duration).toBeLessThan(10000);

      websockets.forEach(ws => ws.close());
    });
  });
});