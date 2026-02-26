import { DocumentSession } from '../backend/document/documentSession';
import { MockClientConnection } from './mockClientConnection';
import { Delta } from '../delta/delta';

describe('Sticky Notes in DocumentSession', () => {
  test('throws when user is not found', () => {
    const session = new DocumentSession('doc-1', { s1: 'Hello' });

    const msg = { docId: 'doc-1', stickyId: 's1', baseVersion: 0, ops: [{ type: 'insert', text: 'X' }] };

    expect(() => session.applyDelta('alice', msg as any)).toThrow('INVALID USER ID');
  });

  test('throws when sticky id is invalid', () => {
    const session = new DocumentSession('doc-1', { s1: 'Hello' });
    const conn = new MockClientConnection();
    session.addUser('alice', conn as any);

    const msg = { docId: 'doc-1', stickyId: 'missing', baseVersion: 0, ops: [{ type: 'insert', text: 'X' }] };

    expect(() => session.applyDelta('alice', msg as any)).toThrow('INVALID STICKY ID');
  });

  test('applies insert to sticky and updates version & history', () => {
    const session = new DocumentSession('doc-1', { s1: 'Hello' });
    const conn = new MockClientConnection();
    session.addUser('alice', conn as any);

    const delta: Delta = { ops: [ { type: 'retain', count: 5 }, { type: 'insert', text: ' World' } ] };

    const result = session.applyDelta('alice', { docId: 'doc-1', stickyId: 's1', baseVersion: 0, ops: delta.ops });

    expect(result).not.toBeNull();
    expect(result?.version).toBe(1);
    expect(session.getContent()['s1']).toBe('Hello World');
    expect(session.getVersion()).toBe(1);

    const deltas = session.getDeltasSince(0);
    expect(deltas.length).toBe(1);
    expect(session.hasUser('alice')).toBe(true);
  });

  test('concurrent edits from two users converge and broadcast occurs', () => {
    const session = new DocumentSession('doc-1', { s1: 'A' });
    const conn1 = new MockClientConnection();
    const conn2 = new MockClientConnection();

    session.addUser('alice', conn1 as any);
    session.addUser('bob', conn2 as any);

    const delta1: Delta = { ops: [ { type: 'retain', count: 1 }, { type: 'insert', text: 'X' } ] };
    const delta2: Delta = { ops: [ { type: 'retain', count: 1 }, { type: 'insert', text: 'Y' } ] };

    // Alice applies first
    const r1 = session.applyDelta('alice', { docId: 'doc-1', stickyId: 's1', baseVersion: 0, ops: delta1.ops });
    expect(r1).not.toBeNull();

    // Bob should receive a delta broadcast from Alice's edit
    const bobDeltas = conn2.getMessagesByType('delta');
    expect(bobDeltas.length).toBeGreaterThan(0);

    // Bob applies his edit based on v0 (concurrent)
    const r2 = session.applyDelta('bob', { docId: 'doc-1', stickyId: 's1', baseVersion: 0, ops: delta2.ops });
    expect(r2).not.toBeNull();

    // Final content should contain both inserts
    const final = session.getContent()['s1'];
    expect(final).toMatch(/X/);
    expect(final).toMatch(/Y/);
    expect(session.getVersion()).toBe(2);
    const deltas = session.getDeltasSince(0);
    expect(deltas.length).toBe(2);
  });
});
