/**
 * backend-tests.test.ts
 * 
 * Comprehensive unit tests for the entire OT backend
 * 
 * Run with: npm test
 */

import { DocumentManager } from '../backend/document/documentManager';
import { DocumentSession } from '../backend/document/documentSession';
import { SnapshotStore,  } from '../backend/storage/snapshotStore';
import { RedisOperationStore } from '../backend/storage/operationStore';
import { ClientConnection } from '../backend/ws/clientConnection';
import { transform, apply } from '../backend/ot/operationalTransformation';
import { Delta, DeltaOp } from '../delta/deltaUtil';
import { MockClientConnection } from './mockClientConnection';
import { MongoSnapshotStore } from '../backend/storage/snapshotStore';
import { after } from 'next/server';




// ============================================
// TEST FRAMEWORK (Jest)
// ============================================
//describe('Operational Transformation Tests', () => {
  
  // ==========================================
  // 1. BASIC OT FUNCTIONS
  // ==========================================
  
  /*describe('Transform Function', () => {
    /*
    test('Insert vs Insert - same position', () => {
      const op1: Delta = {
        ops: [
          { type: 'retain', count: 5 },
          { type: 'insert', text: 'A' }
        ]
      };
      
      const op2: Delta = {
        ops: [
          { type: 'retain', count: 5 },
          { type: 'insert', text: 'B' }
        ]
      };
      
      const transformed = transform(op1, op2);
      console.log(transformed.ops);
      // A should be inserted after B's insertion
      expect(transformed.ops).toEqual([
        { type: 'retain', count: 6 },  // 5 + 1 (B's insert)
        { type: 'insert', text: 'A' }
      ]);
    });
    
    test('Insert vs Delete', () => {
      const insert: Delta = {
        ops: [
          { type: 'retain', count: 5 },
          { type: 'insert', text: 'Hello' }
        ]
      };
      
      const del: Delta = {
        ops: [
          { type: 'retain', count: 3 },
          { type: 'delete', count: 2 }
        ]
      };
      
      const transformed = transform(insert, del);
      
      // Insert position adjusted for deletion
      expect(transformed.ops).toEqual([
        { type: 'retain', count: 3 },  // Adjusted position
        { type: 'insert', text: 'Hello' }
      ]);
    });
    
    test('Delete vs Delete - same position', () => {
      const del1: Delta = {
        ops: [
          { type: 'retain', count: 5 },
          { type: 'delete', count: 3 }
        ]
      };
      
      const del2: Delta = {
        ops: [
          { type: 'retain', count: 5 },
          { type: 'delete', count: 2 }
        ]
      };
      
      const transformed = transform(del1, del2);
      
      // del1 only deletes what's left after del2
      expect(transformed.ops).toEqual([
        { type: 'retain', count: 5 },
        { type: 'delete', count: 1 }  // 3 - 2 = 1
      ]);
    });
  });
  
  describe('Apply Function', () => {
    
    test('Apply insert', () => {
      const content = 'Hello World';
      const delta: Delta = {
        ops: [
          { type: 'retain', count: 6 },
          { type: 'insert', text: 'Beautiful ' }
        ]
      };
      
      const result = apply(content, delta);
      expect(result).toBe('Hello Beautiful World');
    });
    
    test('Apply delete', () => {
      const content = 'Hello World';
      const delta: Delta = {
        ops: [
          { type: 'retain', count: 6 },
          { type: 'delete', count: 5 }
        ]
      };
      
      const result = apply(content, delta);
      expect(result).toBe('Hello ');
    });
    
    test('Apply complex delta', () => {
      const content = 'Hello World';
      const delta: Delta = {
        ops: [
          { type: 'retain', count: 5 },
          { type: 'delete', count: 1 },
          { type: 'insert', text: ', Beautiful ' },
          { type: 'retain', count: 5 }
        ]
      };
      
      const result = apply(content, delta);
      expect(result).toBe('Hello, Beautiful World');
    });
  });
  
  describe('OT Convergence', () => {
    
    test('Two clients converge to same state', () => {
      const initial = 'abc';
      
      // Client 1: Insert 'X' at position 1
      const op1: Delta = {
        ops: [
          { type: 'retain', count: 1 },
          { type: 'insert', text: 'X' }
        ]
      };
      
      // Client 2: Insert 'Y' at position 2
      const op2: Delta = {
        ops: [
          { type: 'retain', count: 2 },
          { type: 'insert', text: 'Y' }
        ]
      };
      
      // Client 1's path: abc → aXbc → transform op2 against op1 → apply
      const state1_1 = apply(initial, op1);  // aXbc
      const op2_transformed = transform(op2, op1);
      const state1_final = apply(state1_1, op2_transformed);
      
      // Client 2's path: abc → abYc → transform op1 against op2 → apply
      const state2_1 = apply(initial, op2);  // abYc
      const op1_transformed = transform(op1, op2);
      const state2_final = apply(state2_1, op1_transformed);
      
      // Both should converge to same state
      expect(state1_final).toBe(state2_final);
      expect(state1_final).toBe('aXbYc');
    });
  });*/
  
  // ==========================================
  // 2. DOCUMENT SESSION TESTS
  // ==========================================
  
  /*describe('DocumentSession', () => {
    let session: DocumentSession;
    let mockConnection: MockClientConnection;
    
    beforeEach(() => {
      session = new DocumentSession('doc-1', 'Hello World');
      mockConnection = new MockClientConnection();
    });*/
    
    /*test('Initial state', () => {
      expect(session.getContent()).toBe('Hello World');
      expect(session.getVersion()).toBe(0);
      expect(session.getUserCount()).toBe(0);
    });
    
    /*test('Add user', () => {
      session.addUser('alice', mockConnection);
      
      expect(session.getUserCount()).toBe(1);
      expect(session.getUsers()).toContain('alice');
      expect(mockConnection.messages.length).toBeGreaterThan(0);
    });
    
    /*test('Remove user', () => {
      session.addUser('alice', mockConnection);
      const isEmpty = session.removeUser('alice');
      
      expect(isEmpty).toBe(true);
      expect(session.getUserCount()).toBe(0);
    });*/
    
    /*test('Apply delta', () => {
      session.addUser('alice', mockConnection);
      
      const delta: Delta = {
        ops: [
          { type: 'retain', count: 11 },
          { type: 'insert', text: '!' }
        ]
      };
      
      const result = session.applyDelta('alice', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: delta.ops
      });
      
      expect(result).not.toBeNull();
      expect(result?.version).toBe(1);
      expect(session.getContent()).toBe('Hello World!');
      expect(session.getVersion()).toBe(1);
    });
    
    test('Version mismatch rejected', () => {
      session.addUser('alice', mockConnection);
      
      const result = session.applyDelta('alice', {
        docId: 'doc-1',
        baseVersion: 5,  // Wrong version!
        ops: [{ type: 'insert', text: 'x' }]
      });
      
      expect(result).toBeNull();
    });*/
    
    /*test('Transform concurrent operations', () => {
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      
      session.addUser('alice', conn1);
      session.addUser('bob', conn2);
      
      // Alice inserts at position 0
      const delta1: Delta = {
        ops: [{ type: 'insert', text: 'A' }]
      };
      
      session.applyDelta('alice', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: delta1.ops
      });
      
      // Bob inserts at position 0 (also based on v0)
      const delta2: Delta = {
        ops: [{ type: 'insert', text: 'B' }]
      };
      
      session.applyDelta('bob', {
        docId: 'doc-1',
        baseVersion: 0,  // Based on v0, but server is now v1
        ops: delta2.ops
      });
      
      // Content should have both insertions
      const content = session.getContent();
      expect(content).toContain('A');
      expect(content).toContain('B');
    });
    
    test('Update cursor', () => {
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      
      session.addUser('alice', conn1);
      session.addUser('bob', conn2);
      
      session.updateCursor('alice', { line: 1, ch: 5 });
      
      // Bob should receive cursor update
      const cursorMessages = conn2.messages.filter(
        m => m.type === 'cursor' && m.userId === 'alice'
      );
      
      expect(cursorMessages.length).toBeGreaterThan(0);
    });*/
  //});
  
  // ==========================================
  // 3. DOCUMENT MANAGER TESTS
  // ==========================================
  
describe("DocumentManager", () => {
  let manager: DocumentManager;
  let snapshotStore: MongoSnapshotStore;
  let operationStore: RedisOperationStore;

  beforeEach(async () => {
    snapshotStore = await MongoSnapshotStore.create();
    operationStore = new RedisOperationStore();

    manager = new DocumentManager({
      snapshotStore,
      operationStore,
      snapshotInterval: 3, // Snapshot every 3 operations
    });
  });

    
    /*test('Create new session', async () => {
      const session = await manager.getOrCreateSession('doc-1');
      
      expect(session).toBeDefined();
      expect(session.getContent()).toBe('');
      expect(manager.hasActiveSession('doc-1')).toBe(true);
     // await manager.shutdown(); // Clean up after test
     // operationStore.shutdown(); // Clean up Redis connection
      //snapshotStore.shutdown(); // Clean up MongoDB connection
    });
    
    test('Get existing session', async () => {
      const session1 = await manager.getOrCreateSession('doc-1');
      const session2 = await manager.getOrCreateSession('doc-1');
      
      expect(session1).toBe(session2);
     // await manager.shutdown(); // Clean up after test
      //operationStore.shutdown(); // Clean up Redis connection
     // snapshotStore.shutdown(); // Clean up MongoDB connection
    });
    
    test('Load from snapshot', async () => {
      // Save a snapshot
      await snapshotStore.save('doc-1', {
        content: 'Saved content',
        version: 10,
        timestamp: Date.now()
      });
      
      // Get session (should load from snapshot)
      const session = await manager.getOrCreateSession('doc-1');
      
      expect(session.getContent()).toBe('Saved content');
    });
    
    test('Join session', async () => {
      const conn = new MockClientConnection();
      
      const session = await manager.joinSession('doc-1', 'alice', conn);
      
      expect(session.getUserCount()).toBe(1);
      expect(manager.getUserDocument('alice')).toBe('doc-1');
      expect(manager.getTotalUserCount()).toBe(1);
    });
    
    test('User switches documents', async () => {
      const conn = new MockClientConnection();
      
      await manager.joinSession('doc-1', 'alice', conn);
      await manager.joinSession('doc-2', 'alice', conn);
      
      expect(manager.getUserDocument('alice')).toBe('doc-2');
      expect(manager.getTotalUserCount()).toBe(1);
      
      // Alice should be removed from doc-1
      const session1 = manager.getSession('doc-1');
      expect(session1?.getUserCount()).toBe(0);
    });
    
    test('Leave session', async () => {
      const conn = new MockClientConnection();
      
      await manager.joinSession('doc-1', 'alice', conn);
      await manager.leaveSession('alice');
      
      expect(manager.getUserDocument('alice')).toBeUndefined();
      expect(manager.getTotalUserCount()).toBe(0);
    });*/
    
    /*test('Handle operation', async () => {
      const conn = new MockClientConnection();
      
      await manager.joinSession('doc-1', 'alice', conn);
      
      const result = await manager.handleOperation('alice', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: [{ type: 'insert', text: 'Hello' }]
      });
      
      expect(result).not.toBeNull();
      expect(result?.version).toBe(1);
      
      const session = manager.getSession('doc-1');
      expect(session?.getContent()).toBe('Hello');

      await snapshotStore.delete('doc-1'); // Clean up test snapshot
      await snapshotStore.delete('doc-2'); // Clean up test snapshot
    });*/
    
    test('Throw error if user not in session', async () => {
      await expect(async () => {
        await manager.handleOperation('alice', {
          docId: 'doc-1',
          baseVersion: 0,
          ops: [{ type: 'insert', text: 'Hello' }]
        });
      }).rejects.toThrow('not in any session');
    });
    
    test('Save snapshot at interval', async () => {
      const conn = new MockClientConnection();
      await manager.joinSession('doc-1', 'alice', conn);
      
      // Send 3 operations (snapshot interval = 3)
      for (let i = 0; i < 3; i++) {
        await manager.handleOperation('alice', {
          docId: 'doc-1',
          baseVersion: i,
          ops: [{ type: 'insert', text: `${i}` }]
        });
      }
      
      // Check snapshot was saved
      const snapshot = await snapshotStore.load('doc-1');
      expect(snapshot).not.toBeNull();
      expect(snapshot?.version).toBe(3);
    });
    
    test('Update cursor', async () => {
      const conn = new MockClientConnection();
      await manager.joinSession('doc-1', 'alice', conn);
      
      manager.updateCursor('alice', { line: 1, ch: 5 });
      
      // Should not throw
      expect(true).toBe(true);
    });
    
    test('Get stats', async () => {
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      
      await manager.joinSession('doc-1', 'alice', conn1);
      await manager.joinSession('doc-2', 'bob', conn2);
      
      const stats = manager.getStats();
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalUsers).toBe(2);
      expect(stats.sessions.length).toBe(2);
    });
    
    test('Multiple users in same document', async () => {
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      const conn3 = new MockClientConnection();
      
      await manager.joinSession('doc-1', 'alice', conn1);
      await manager.joinSession('doc-1', 'bob', conn2);
      await manager.joinSession('doc-1', 'carol', conn3);
      
      const session = manager.getSession('doc-1');
      expect(session?.getUserCount()).toBe(3);
    });

    afterAll(async () => {
      await manager.shutdown();
      await operationStore.shutdown();
      await snapshotStore.shutdown();
    });
  });
  
  // ==========================================
  // 4. STORAGE TESTS
  // ==========================================
  
  /*describe('InMemorySnapshotStore', () => {
    let store: MongoSnapshotStore;
    
    beforeEach(async () => {
      store = await MongoSnapshotStore.create();
    });
    
    test('Save and load snapshot', async () => {
      await store.save('doc-1', {
        content: 'Test content',
        version: 5,
        timestamp: Date.now()
      });
      
      const loaded = await store.load('doc-1');
      
      expect(loaded).not.toBeNull();
      expect(loaded?.content).toBe('Test content');
      expect(loaded?.version).toBe(5);
    });
    
    test('Load nonexistent snapshot', async () => {
      const loaded = await store.load('doc-nonexistent');
      expect(loaded).toBeNull();
    });
    
    test('Update existing snapshot', async () => {
      await store.save('doc-1', {
        content: 'Version 1',
        version: 1,
        timestamp: Date.now()
      });
      
      await store.save('doc-1', {
        content: 'Version 2',
        version: 2,
        timestamp: Date.now()
      });
      
      const loaded = await store.load('doc-1');
      expect(loaded?.content).toBe('Version 2');
      expect(loaded?.version).toBe(2);
    });
    
    test('Delete snapshot', async () => {
      await store.save('doc-1', {
        content: 'Test',
        version: 1,
        timestamp: Date.now()
      });
      
      await store.delete('doc-1');
      
      const loaded = await store.load('doc-1');
      expect(loaded).toBeNull();
    });
  });
  
  describe('InMemoryOperationStore', () => {
    let store: RedisOperationStore;
    
    beforeEach(() => {
      store = new RedisOperationStore();
    });
    
    test('Save and retrieve operations', async () => {
      await store.save({
        documentId: 'doc-1',
        version: 1,
        delta: { ops: [{ type: 'insert', text: 'A' }] },
        timestamp: Date.now(),
        author: 'alice'
      });
      
      const ops = await store.getOperationsSince('doc-1', 0);
      
      expect(ops.length).toBe(1);
      expect(ops[0].version).toBe(1);
      expect(ops[0].author).toBe('alice');
    });
    
    test('Filter operations by version', async () => {
      for (let i = 1; i <= 5; i++) {
        await store.save({
          documentId: 'doc-1',
          version: i,
          delta: { ops: [] },
          timestamp: Date.now(),
          author: 'alice'
        });
      }
      
      const ops = await store.getOperationsSince('doc-1', 2);
      
      expect(ops.length).toBe(3);  // v3, v4, v5
      expect(ops[0].version).toBe(3);
    });
    
    test('Multiple documents', async () => {
      await store.save({
        documentId: 'doc-1',
        version: 1,
        delta: { ops: [] },
        timestamp: Date.now(),
        author: 'alice'
      });
      
      await store.save({
        documentId: 'doc-2',
        version: 1,
        delta: { ops: [] },
        timestamp: Date.now(),
        author: 'bob'
      });
      
      const ops1 = await store.getOperationsSince('doc-1', 0);
      const ops2 = await store.getOperationsSince('doc-2', 0);
      
      expect(ops1.length).toBe(1);
      expect(ops2.length).toBe(1);
      expect(ops1[0].author).toBe('alice');
      expect(ops2[0].author).toBe('bob');
    });
    
    test('Get count', async () => {
      for (let i = 1; i <= 3; i++) {
        await store.save({
          documentId: 'doc-1',
          version: i,
          delta: { ops: [] },
          timestamp: Date.now(),
          author: 'alice'
        });
      }
      
      const count = await store.getCount('doc-1');
      expect(count).toBe(3);
    });
    
    test('Delete operations', async () => {
      await store.save({
        documentId: 'doc-1',
        version: 1,
        delta: { ops: [] },
        timestamp: Date.now(),
        author: 'alice'
      });
      
      await store.delete('doc-1');
      
      const count = await store.getCount('doc-1');
      expect(count).toBe(0);
    });
  });*/
  
  // ==========================================
  // 5. INTEGRATION TESTS
  // ==========================================
  
  /*describe('Integration Tests', () => {
    
    test('Complete user flow', async () => {
      const manager = new DocumentManager({
        snapshotStore: await MongoSnapshotStore.create(),
        operationStore: new RedisOperationStore()
      });
      
      const alice = new MockClientConnection();
      const bob = new MockClientConnection();
      
      // Alice joins
      await manager.joinSession('doc-1', 'alice', alice, 'Initial content');
      
      // Bob joins
      await manager.joinSession('doc-1', 'bob', bob);
      
      // Alice types
      await manager.handleOperation('alice', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: [
          { type: 'retain', count: 15 },
          { type: 'insert', text: ' from Alice' }
        ]
      });
      
      // Bob types (concurrent)
      await manager.handleOperation('bob', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: [
          { type: 'retain', count: 15 },
          { type: 'insert', text: ' from Bob' }
        ]
      });
      
      // Check final state
      const session = manager.getSession('doc-1');
      const content = session?.getContent();
      
      expect(content).toContain('Initial content');
      expect(content).toContain('from Alice');
      expect(content).toContain('from Bob');
      
      // Check both got updates
      expect(alice.messages.length).toBeGreaterThan(0);
      expect(bob.messages.length).toBeGreaterThan(0);
    });
    
    test('Three-way concurrent edit', async () => {
      const manager = new DocumentManager({
        snapshotStore: await MongoSnapshotStore.create()
      });
      
      const conn1 = new MockClientConnection();
      const conn2 = new MockClientConnection();
      const conn3 = new MockClientConnection();
      
      await manager.joinSession('doc-1', 'alice', conn1, 'abc');
      await manager.joinSession('doc-1', 'bob', conn2);
      await manager.joinSession('doc-1', 'carol', conn3);
      
      // All three insert at position 1 (based on v0)
      await manager.handleOperation('alice', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: [
          { type: 'retain', count: 1 },
          { type: 'insert', text: 'X' }
        ]
      });
      
      await manager.handleOperation('bob', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: [
          { type: 'retain', count: 1 },
          { type: 'insert', text: 'Y' }
        ]
      });
      
      await manager.handleOperation('carol', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: [
          { type: 'retain', count: 1 },
          { type: 'insert', text: 'Z' }
        ]
      });
      
      const session = manager.getSession('doc-1');
      const content = session?.getContent();
      
      // Should contain all insertions
      expect(content).toContain('X');
      expect(content).toContain('Y');
      expect(content).toContain('Z');
      expect(content).toContain('abc');
    });
    
    test('Server restart recovery', async () => {
      const snapshotStore = await MongoSnapshotStore.create();
      
      // First server instance
      let manager = new DocumentManager({ snapshotStore });
      
      const conn = new MockClientConnection();
      await manager.joinSession('doc-1', 'alice', conn, 'Initial');
      
      await manager.handleOperation('alice', {
        docId: 'doc-1',
        baseVersion: 0,
        ops: [{ type: 'insert', text: ' content' }]
      });
      
      await manager.leaveSession('alice');
      
      // Simulate server restart
      manager = new DocumentManager({ snapshotStore });
      
      // Load document (should restore from snapshot)
      const session = await manager.getOrCreateSession('doc-1');
      
      expect(session.getContent()).toContain('Initial');
      expect(session.getContent()).toContain('content');
    });
  });*/
//});