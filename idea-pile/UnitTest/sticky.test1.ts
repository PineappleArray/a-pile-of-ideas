import { DocumentSession } from '../backend/document/documentSession';
import { MockClientConnection } from './mockClientConnection';
import { Delta } from '../delta/delta';
import { applyTransform, positionToDelta, getLengthChange, invert } from '../backend/ot/operationalTransformation';
import stickyNote from '../shared/notes';

describe('Sticky Notes in DocumentSession', () => {
  test('throws when user is not found', () => {
    const session = new DocumentSession('doc-1', { s1: new stickyNote(0, 0, 's1', 'Hello', 200, 200, 20, 20) });

    const msg = { type: 'delta', docId: 'doc-1', stickyId: 's1', baseVersion: 0, ops: [{ type: 'insert', text: 'X' }] };

    expect(() => session.applyDelta('alice', msg as any)).toThrow('INVALID USER ID');
  });

  test('throws when sticky id is invalid', () => {
    const session = new DocumentSession('doc-1', { s1: new stickyNote(0, 0, 's1', 'Hello', 200, 200, 20, 20) });
    const conn = new MockClientConnection();
    session.addUser('alice', conn as any);

    const msg = { type: 'delta', docId: 'doc-1', stickyId: 'missing', baseVersion: 0, ops: [{ type: 'insert', text: 'X' }] };

    expect(() => session.applyDelta('alice', msg as any)).toThrow('INVALID STICKY ID');
  });

  test('applies insert to sticky and updates version & history', () => {
    const session = new DocumentSession('doc-1', { s1: new stickyNote(0, 0, 's1', 'Hello', 200, 200, 20, 20) });
    const conn = new MockClientConnection();
    session.addUser('alice', conn as any);

    const delta: Delta = { ops: [ { type: 'retain', count: 5 }, { type: 'insert', text: ' World' } ] };

    const result = session.applyDelta('alice', { type: 'delta', docId: 'doc-1', stickyId: 's1', baseVersion: 0, ops: delta.ops });

    expect(result).not.toBeNull();
    expect(result?.version).toBe(1);
    expect(session.getContent()['s1'].text).toBe('Hello World');
    expect(session.getVersion()).toBe(1);

    const deltas = session.getDeltasSince(0);
    expect(deltas.length).toBe(1);
    expect(session.hasUser('alice')).toBe(true);
  });

  test('concurrent edits from two users converge and broadcast occurs', () => {
    const session = new DocumentSession('doc-1', { s1: new stickyNote(0, 0, 's1', 'A', 200, 200, 20, 20) });
    const conn1 = new MockClientConnection();
    const conn2 = new MockClientConnection();

    session.addUser('alice', conn1 as any);
    session.addUser('bob', conn2 as any);

    const delta1: Delta = { ops: [ { type: 'retain', count: 1 }, { type: 'insert', text: 'X' } ] };
    const delta2: Delta = { ops: [ { type: 'retain', count: 1 }, { type: 'insert', text: 'Y' } ] };

    // Alice applies first
    const r1 = session.applyDelta('alice', { type: 'delta', docId: 'doc-1', stickyId: 's1', baseVersion: 0, ops: delta1.ops });
    expect(r1).not.toBeNull();

    // Bob should receive a delta broadcast from Alice's edit
    const bobDeltas = conn2.getMessagesByType('delta');
    expect(bobDeltas.length).toBeGreaterThan(0);

    // Bob applies his edit based on v0 (concurrent)
    const r2 = session.applyDelta('bob', { type: 'delta', docId: 'doc-1', stickyId: 's1', baseVersion: 0, ops: delta2.ops });
    expect(r2).not.toBeNull();

    // Final content should contain both inserts
    const final = session.getContent()['s1'].text;
    expect(final).toMatch(/X/);
    expect(final).toMatch(/Y/);
    expect(session.getVersion()).toBe(2);
    const deltas = session.getDeltasSince(0);
    expect(deltas.length).toBe(2);
  });
});

describe('OT helpers and sticky transformations', () => {
  test('applyTransform moves and resizes sticky note', () => {
    const note = new stickyNote(10, 20, 's1', 'hi', 100, 100, 10, 10);

    const transform = { ops: [ { type: 'move', dx: 5, dy: -3 }, { type: 'resize', dw: 2, dh: 4 } ] } as any;

    const result = applyTransform(note, transform);

    // expected new coords and size
    expect(result.centerX).toBe(15);
    expect(result.centerY).toBe(17);
    expect(result.box_width).toBe(12);
    expect(result.box_height).toBe(14);
  });

  test('positionToDelta creates proper ops for insert and delete and length change', () => {
    const insertDelta = positionToDelta(2, { type: 'insert', text: 'AB' }, 5);
    expect(insertDelta.ops[0]).toEqual({ type: 'retain', count: 2 });
    expect(insertDelta.ops[1]).toEqual({ type: 'insert', text: 'AB' });

    const deleteDelta = positionToDelta(1, { type: 'delete', length: 2 }, 5);
    expect(deleteDelta.ops[0]).toEqual({ type: 'retain', count: 1 });
    expect(deleteDelta.ops[1]).toEqual({ type: 'delete', count: 2 });

    expect(getLengthChange(insertDelta)).toBe(2);
    expect(getLengthChange(deleteDelta)).toBe(-2);
  });

  test('invert produces an inverse delta', () => {
    const delta: Delta = { ops: [ { type: 'retain', count: 2 }, { type: 'insert', text: 'X' }, { type: 'delete', count: 1 } ] };
    const baseText = 'abcde';

    const inv = invert(delta, baseText as any);

    // inserted X should become a delete of length 1
    expect(inv.ops.find(o => (o as any).type === 'delete')).toBeDefined();
    // deleted char should be re-inserted (from baseText at index 3)
    const insertOp = inv.ops.find(o => (o as any).type === 'insert') as any;
    expect(insertOp).toBeDefined();
    expect(typeof insertOp.text).toBe('string');
  });
});
