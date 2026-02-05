//Preserves deterministic edits as without using ops
//Some edits will result in a random letter being deleting
import { Delta, DeltaOp } from '../delta/deltaUtil';

function cloneOps(ops: DeltaOp[]): DeltaOp[] {
  return ops.map(op => ({ ...op }));
}

function opLength(op: DeltaOp): number {
  if (op.type === 'insert') return op.text.length;
  return op.count;
}

export class OperationalTransformation {
  static transform(
    a: Delta,
    b: Delta
  ): [Delta, Delta] {
    const aOps = cloneOps(a.ops);
    const bOps = cloneOps(b.ops);

    const aPrime: DeltaOp[] = [];
    const bPrime: DeltaOp[] = [];

    let i = 0;
    let j = 0;

    while (i < aOps.length || j < bOps.length) {
      const opA = aOps[i];
      const opB = bOps[j];

      // INSERT vs INSERT (deterministic ordering: A before B)
      if (opA?.type === 'insert' && opB?.type === 'insert') {
        aPrime.push(opA);
        bPrime.push({ type: 'retain', count: opA.text.length });

        aPrime.push({ type: 'retain', count: opB.text.length });
        bPrime.push(opB);

        i++; j++;
        continue;
      }

      // INSERT vs anything
      if (opA?.type === 'insert') {
        aPrime.push(opA);
        bPrime.push({ type: 'retain', count: opA.text.length });
        i++;
        continue;
      }

      if (opB?.type === 'insert') {
        aPrime.push({ type: 'retain', count: opB.text.length });
        bPrime.push(opB);
        j++;
        continue;
      }

      if (!opA || !opB) break;

      const min = Math.min(opLength(opA), opLength(opB));

      // RETAIN vs RETAIN
      if (opA.type === 'retain' && opB.type === 'retain') {
        aPrime.push({ type: 'retain', count: min });
        bPrime.push({ type: 'retain', count: min });
      }

      // DELETE vs DELETE (both delete → nothing)
      else if (opA.type === 'delete' && opB.type === 'delete') {
        // no-op
      }

      // DELETE vs RETAIN
      else if (opA.type === 'delete' && opB.type === 'retain') {
        aPrime.push({ type: 'delete', count: min });
      }

      // RETAIN vs DELETE
      else if (opA.type === 'retain' && opB.type === 'delete') {
        bPrime.push({ type: 'delete', count: min });
      }

      // consume lengths
      consume(opA, min, aOps, i);
      consume(opB, min, bOps, j);

      if (opLength(opA) === 0) i++;
      if (opLength(opB) === 0) j++;
    }

    return [{ ops: merge(aPrime) }, { ops: merge(bPrime) }];
  }
}

function consume(op: DeltaOp, n: number, ops: DeltaOp[], idx: number) {
  if (op.type === 'insert') {
    op.text = op.text.slice(n);
  } else {
    op.count -= n;
  }
}

function merge(ops: DeltaOp[]): DeltaOp[] {
  const out: DeltaOp[] = [];
  for (const op of ops) {
    const last = out[out.length - 1];
    if (last && last.type === op.type) {
      if (op.type === 'insert') last.text += op.text;
      else last.count += op.count;
    } else if (opLength(op) > 0) {
      out.push({ ...op });
    }
  }
  return out;
}
