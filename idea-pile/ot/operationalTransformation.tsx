//Preserves deterministic edits as without using ops
//Some edits will result in a random letter being deleting
import { Delta, DeltaOp } from '../delta/deltaUtil';

//clones ops so objects are not permutated to ensure data safety
//my code mutates the ops
function cloneOps(ops: DeltaOp[]): DeltaOp[] {
  return ops.map(op => ({ ...op }));
}

//returns op length
function opLength(op: DeltaOp): number {
  if (op.type === 'insert') return op.text.length;
  return op.count;
}

//will transform deltas and execute deltas in a way
//that preserves data integriy
export class OperationalTransformation {

  //manages multiple user edits
  static transform(a: Delta, b: Delta): [Delta, Delta] {

    //clones ops to make sure they dont mutate
    const aOps = cloneOps(a.ops);
    const bOps = cloneOps(b.ops);

    //stores the deltas done by each person in accordance to the other user
    const aPrime: DeltaOp[] = [];
    const bPrime: DeltaOp[] = [];

    let i = 0;
    let j = 0;

    while (i < aOps.length || j < bOps.length) {
      const opA = aOps[i];
      const opB = bOps[j];

      //INSERT vs INSERT
      //This is always deterministic A gets prio over user B
      if (opA?.type === 'insert' && opB?.type === 'insert') {
        aPrime.push(opA);
        bPrime.push({ type: 'retain', count: opA.text.length });

        aPrime.push({ type: 'retain', count: opB.text.length });
        bPrime.push(opB);

        i++; j++;
        continue;
      }

      //INSERT vs anything
      //Insert is executed first always
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

      //when both have retains
      //Determanistic will push A's retain first
      if (opA.type === 'retain' && opB.type === 'retain') {
        aPrime.push({ type: 'retain', count: min });
        bPrime.push({ type: 'retain', count: min });
      }

      // if both are deleting a piece of data
      else if (opA.type === 'delete' && opB.type === 'delete') {
        // no-op
      }

      //if delete is executed it will truncade retain
      else if (opA.type === 'delete' && opB.type === 'retain') {
        aPrime.push({ type: 'delete', count: min });
      }

      else if (opA.type === 'retain' && opB.type === 'delete') {
        bPrime.push({ type: 'delete', count: min });
      }

      //this will go through the string
      consume(opA, min, aOps, i);
      consume(opB, min, bOps, j);

      if (opLength(opA) === 0) {
        i++;
      }
      if (opLength(opB) === 0) {
        j++;
      }
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
      if (op.type === 'insert' && last.type == 'insert') {
        last.text += op.text;
      } else if(last.type !== 'insert' && op.type !== 'insert'){
        last.count += op.count;
      }
    } else if (opLength(op) > 0) {
      out.push({ ...op });
    }
  }
  return out;
}
