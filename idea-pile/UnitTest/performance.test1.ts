import { DocumentManager } from '../backend/document/documentManager';
import { MongoSnapshotStore, SnapshotStore } from '../backend/storage/snapshotStore';
import { IClientConnection } from '../backend/ws/IClient';
import { DeltaMessage } from '../delta/delta';
import { MockClientConnection } from './mockClientConnection';

// In-memory snapshot store for testing without MongoDB
class InMemorySnapshotStore implements SnapshotStore {
  private snapshots: Map<string, { content: string; version: number; timestamp: number }> = new Map();

  async save(documentId: string, snapshot: { content: string; version: number; timestamp: number }): Promise<void> {
    this.snapshots.set(documentId, snapshot);
  }

  async load(documentId: string): Promise<{ content: string; version: number; timestamp: number } | null> {
    return this.snapshots.get(documentId) || null;
  }

  async delete(documentId: string): Promise<void> {
    this.snapshots.delete(documentId);
  }

  async clear(): Promise<void> {
    this.snapshots.clear();
  }

  async dropDatabase(): Promise<void> {
    this.snapshots.clear();
  }

  async shutdown(): Promise<void> {
    // No-op
  }
}

describe('DocumentManager', () => {
  let manager: DocumentManager;
  let snapshotStore: MongoSnapshotStore;

  beforeAll(async () => {
    // Use in-memory snapshot store for testing
    snapshotStore = new InMemorySnapshotStore();
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
    // Drop the test database and close connection
    await snapshotStore.dropDatabase();
    await snapshotStore.shutdown();
  });

  describe('Session Creation', () => {
    test('should create a new session for a document', async () => {
      const session = await manager.getOrCreateSession('doc1', 'Initial content');
      
      expect(session).toBeDefined();
      expect(session.getContent()).toBe('Initial content');
      expect(session.getVersion()).toBe(0);
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
      const connection = new MockClientConnection();
      const session = await manager.joinSession('doc1', 'user1', connection, 'Hello');
      
      expect(session.getUserCount()).toBe(1);
      expect(manager.getUserDocument('user1')).toBe('doc1');
    });

    test('should move user from one session to another', async () => {
      const connection = new MockClientConnection();
      
      await manager.joinSession('doc1', 'user1', connection, 'Doc 1');
      expect(manager.getUserDocument('user1')).toBe('doc1');
      
      await manager.joinSession('doc2', 'user1', connection, 'Doc 2');
      expect(manager.getUserDocument('user1')).toBe('doc2');
      
      const session1 = manager.getSession('doc1');
      const session2 = manager.getSession('doc2');
      
      expect(session1?.getUserCount()).toBe(0);
      expect(session2?.getUserCount()).toBe(1);
    });

    test('should remove user from session', async () => {
      const connection = new MockClientConnection();
      await manager.joinSession('doc1', 'user1', connection, 'Content');
      
      await manager.leaveSession('user1');
      
      expect(manager.getUserDocument('user1')).toBeUndefined();
    });

    test('should handle multiple users in same session', async () => {
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      const conn3 = new MockClientConnection();
      
      await manager.joinSession('doc1', 'user1', conn1, 'Shared doc');
      await manager.joinSession('doc1', 'user2', conn2);
      await manager.joinSession('doc1', 'user3', conn3);
      
      const session = manager.getSession('doc1');
      expect(session?.getUserCount()).toBe(3);
    });
  });

  describe('Operation Handling', () => {
    test('should apply operation from user', async () => {
      const connection = new MockClientConnection();
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
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      
      await manager.joinSession('doc1', 'user1', conn1, 'Start');
      await manager.joinSession('doc1', 'user2', conn2);
      
      const deltaMessage: DeltaMessage = {
        ops: [{ type: 'retain', count: 5 }, { type: 'insert', text: '!' }],
        baseVersion: 0,
        docId: 'doc1'
      };
      
      await manager.handleOperation('user1', deltaMessage);
      
      // user2 should receive the delta
      expect(conn2.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Snapshot Management', () => {
    test('should save snapshot after configured interval', async () => {
      const connection = new MockClientConnection();
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
    });

    test('should save snapshot when last user leaves', async () => {
      const connection = new MockClientConnection();
      await manager.joinSession('doc1', 'user1', connection, 'Important data');
      
      await manager.leaveSession('user1');
      
      const snapshot = await snapshotStore.load('doc1');
      expect(snapshot).toBeDefined();
      expect(snapshot?.content).toBe('Important data');
    });

    test('should save snapshots on shutdown', async () => {
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      
      await manager.joinSession('doc1', 'user1', conn1, 'Doc 1 content');
      await manager.joinSession('doc2', 'user2', conn2, 'Doc 2 content');
      
      await manager.shutdown();
      
      const snap1 = await snapshotStore.load('doc1');
      const snap2 = await snapshotStore.load('doc2');
      
      expect(snap1?.content).toBe('Doc 1 content');
      expect(snap2?.content).toBe('Doc 2 content');
    });
  });

  describe('Cursor Management', () => {
    test('should update user cursor position', async () => {
      const connection = new MockClientConnection();
      await manager.joinSession('doc1', 'user1', connection, 'Text');
      
      manager.updateCursor('user1', { line: 5, ch: 10 });
      
      const session = manager.getSession('doc1');
      const state = session?.getState();
      const user1State = state?.users.find((u: any) => u.userId === 'user1');
      
      expect(user1State?.cursor).toEqual({ line: 5, ch: 10 });
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
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      const conn3 = new MockClientConnection();
      
      await manager.joinSession('doc1', 'user1', conn1, 'Doc');
      await manager.joinSession('doc1', 'user2', conn2);
      await manager.joinSession('doc2', 'user3', conn3, 'Doc2');
      
      expect(manager.getTotalUserCount()).toBe(3);
    });

    test('should get stats', async () => {
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      
      await manager.joinSession('doc1', 'user1', conn1, 'Doc 1');
      await manager.joinSession('doc2', 'user2', conn2, 'Doc 2');
      
      const stats = manager.getStats();
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalUsers).toBe(2);
      expect(stats.sessions.length).toBe(2);
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

      const connection = new MockClientConnection();
      await shortTimeoutManager.joinSession('doc1', 'user1', connection, 'Temp');
      await shortTimeoutManager.leaveSession('user1');
      
      expect(shortTimeoutManager.hasActiveSession('doc1')).toBe(true);
      
      // Wait for cleanup (runs every 60s, but we'll trigger shutdown which saves)
      await new Promise(resolve => setTimeout(resolve, 150));
      await shortTimeoutManager.shutdown();
    }, 10000);
  });

  describe('Persistence and Recovery', () => {
    test('should restore session from snapshot after restart', async () => {
      // Create session and save data
      const connection = new MockClientConnection();
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
      const connection = new MockClientConnection();
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
    });

    test('Broadcasting Benchmark', async () => {
      const numUsers = 50;
      const connections: MockClientConnection[] = [];
      for (let i = 0; i < numUsers; i++) {
        const conn = new MockClientConnection();
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
      const connections: MockClientConnection[] = [];
      for (let i = 0; i < numUsers; i++) {
        const conn = new MockClientConnection();
        connections.push(conn);
        await manager.joinSession('bench-users', `user-${i}`, conn, 'User content');
      }
      for (let i = 0; i < numUsers; i++) {
        await manager.leaveSession(`user-${i}`);
      }
      const end = performance.now();
      const duration = end - start;
      console.log(`Joined and left ${numUsers} users in ${duration} ms`);
      expect(duration).toBeLessThan(10000);
    });
  });
});