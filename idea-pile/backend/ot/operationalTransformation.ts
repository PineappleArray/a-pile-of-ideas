import { Delta, DeltaOp, normalizeDelta } from '../../delta/deltaUtil'; // adjust import path

//transforms deltaA against deltaB
export function transform(deltaA: Delta, deltaB: Delta, priority: 'left' | 'right' = 'right'): Delta {
  const opsA = [...deltaA.ops];
  const opsB = [...deltaB.ops];
  
  const toReturn: DeltaOp[] = [];
  
  let i = 0;
  let j = 0;
  let offsetA = 0;
  let offsetB = 0;
  
  //iterates thru A and B until it reaches the end of both
  while (i < opsA.length || j < opsB.length) {
    const opA = opsA[i];
    const opB = opsB[j];
    console.log(opA);
    console.log(opB);
    console.log("------------")
    // If we've exhausted one side, append the rest
    if (!opA) {
      if (opB?.type === 'insert') {
        toReturn.push({ type: 'retain', count: opB.text.length });
      }
      j++;
    } else if (!opB) {
      if(opA.type === 'delete'){
        toReturn.push({type: 'delete', count: opA.count - offsetA})
      } else {
        toReturn.push(opA);
      }
      i++;
    } else {
    
      //if both are inserts
      if (opA.type === 'insert' && opB.type === 'insert') {
        if (priority === 'left') {
          toReturn.push(opA);
          i++;
        } else {
          toReturn.push({ type: 'retain', count: opB.text.length });
          j++;
        }
      } else if (opA.type === 'insert' && opB.type === 'retain') { // A is insert, B is retain
        toReturn.push(opA);
        i++;
      } else if (opA.type === 'insert' && opB.type === 'delete') { // A is insert, B is delete 
        toReturn.push(opA);
        i++;
      } else if (opA.type === 'retain' && opB.type === 'insert') { // A is retain, B is insert
        toReturn.push({ type: 'retain', count: opB.text.length });
        j++;
      } else if (opA.type === 'retain' && opB.type === 'retain') { // A is retain, B is retain
        const minLen = Math.min(opA.count - offsetA, opB.count - offsetB);
        toReturn.push({ type: 'retain', count: minLen });
      
        offsetA += minLen;
        offsetB += minLen;
      
        if (offsetA === opA.count) {
          i++;
          offsetA = 0;
        }
        if (offsetB === opB.count) {
          j++;
          offsetB = 0;
        }
      }
    
      //A is retain, B is delete
      else if (opA.type === 'retain' && opB.type === 'delete') {
        const minLen = Math.min(opA.count - offsetA, opB.count - offsetB);
      
        offsetA += minLen;
        offsetB += minLen;
      
        if (offsetA === opA.count) {
          i++;
          offsetA = 0;
        }
        if (offsetB === opB.count) {
          j++;
          offsetB = 0;
        }
      } else if (opA.type === 'delete' && opB.type === 'insert') { // A is delete, B is insert
        toReturn.push({ type: 'retain', count: opB.text.length });
        j++;
      } else if (opA.type === 'delete' && opB.type === 'retain') { // A is delete, B is retain
        const minLen = Math.min(opA.count - offsetA, opB.count - offsetB);
        toReturn.push({ type: 'delete', count: minLen });
      
        offsetA += minLen;
        offsetB += minLen;
      
        if (offsetA === opA.count) {
          i++;
          offsetA = 0;
        }
        if (offsetB === opB.count) {
          j++;
          offsetB = 0;
        }
      } else if (opA.type === 'delete' && opB.type === 'delete') { //A is delete, B is delete
        const minLen = Math.min(opA.count - offsetA, opB.count - offsetB);
        console.log("RESULT MIN: "+minLen +" OFF-SET-A: "+offsetA);
        offsetA += minLen;
        offsetB += minLen;
      
        if (offsetA === opA.count) {
          i++;
          offsetA = 0;
        }
        if (offsetB === opB.count) {
          j++;
          offsetB = 0;
        }
      }
    }
  }
  
  return normalizeDelta({ ops: toReturn });
}

//merges 2 delta lists into 1
export function compose(deltaA: Delta, deltaB: Delta): Delta {
  const opsA = [...deltaA.ops];
  const opsB = [...deltaB.ops];
  
  const result: DeltaOp[] = [];
  
  let i = 0, j = 0;
  let offsetA = 0, offsetB = 0;
  
  while (i < opsA.length || j < opsB.length) {
    const opA = opsA[i];
    const opB = opsB[j];
    
    if (!opB) {
      if (opA) 
        result.push(opA);
      i++;
      continue;
    }
    
    if (!opA) {
      result.push(opB);
      j++;
      continue;
    }
    
    // B inserts
    if (opB.type === 'insert') {
      result.push(opB);
      j++;
    }
    
    // A inserts, B retains
    else if (opA.type === 'insert' && opB.type === 'retain') {
      const minLen = Math.min(opA.text.length - offsetA, opB.count - offsetB);
      result.push({
        type: 'insert',
        text: opA.text.slice(offsetA, offsetA + minLen),
        attributes: opA.attributes
      });
      
      offsetA += minLen;
      offsetB += minLen;
      
      if (offsetA === opA.text.length) {
        i++;
        offsetA = 0;
      }
      if (offsetB === opB.count) {
        j++;
        offsetB = 0;
      }
    }
    
    // A inserts, B deletes
    else if (opA.type === 'insert' && opB.type === 'delete') {
      const minLen = Math.min(opA.text.length - offsetA, opB.count - offsetB);
      
      offsetA += minLen;
      offsetB += minLen;
      
      if (offsetA === opA.text.length) {
        i++;
        offsetA = 0;
      }
      if (offsetB === opB.count) {
        j++;
        offsetB = 0;
      }
    }
    
    // A retains, B retains
    else if (opA.type === 'retain' && opB.type === 'retain') {
      const minLen = Math.min(opA.count - offsetA, opB.count - offsetB);
      result.push({ type: 'retain', count: minLen });
      
      offsetA += minLen;
      offsetB += minLen;
      
      if (offsetA === opA.count) {
        i++;
        offsetA = 0;
      }
      if (offsetB === opB.count) {
        j++;
        offsetB = 0;
      }
    }
    
    // A retains, B deletes
    else if (opA.type === 'retain' && opB.type === 'delete') {
      const minLen = Math.min(opA.count - offsetA, opB.count - offsetB);
      result.push({ type: 'delete', count: minLen });
      
      offsetA += minLen;
      offsetB += minLen;
      
      if (offsetA === opA.count) {
        i++;
        offsetA = 0;
      }
      if (offsetB === opB.count) {
        j++;
        offsetB = 0;
      }
    }
    
    // A deletes
    else if (opA.type === 'delete') {
      result.push(opA);
      i++;
    }
  }
  
  return normalizeDelta({ ops: result });
}

//executes the deltas onto a string
export function apply(text: string, delta: Delta): string {
  const ops = delta.ops;
  let result = '';
  let index = 0;
  
  //goes thru the entire list of ops and executes the operations
  for (const op of ops) {
    if (op.type === 'retain') {
      result += text.slice(index, index + op.count);
      index += op.count;
    } else if (op.type === 'insert') {
      result += op.text;
    } else if (op.type === 'delete') {
      index += op.count;
    }
  }
  
  //adds the rest to the end
  if (index < text.length) {
    result += text.slice(index);
  }
  
  return result;
}

/**
 * Invert a delta (for undo functionality)
 * Given text and delta, returns a delta that undoes the operation
 */
export function invert(delta: Delta, baseText: string): Delta {
  const ops: DeltaOp[] = [];
  let index = 0;
  
  for (const op of delta.ops) {
    if (op.type === 'retain') {
      ops.push({ type: 'retain', count: op.count });
      index += op.count;
    } else if (op.type === 'insert') {
      ops.push({ type: 'delete', count: op.text.length });
    } else if (op.type === 'delete') {
      ops.push({
        type: 'insert',
        text: baseText.slice(index, index + op.count)
      });
      index += op.count;
    }
  }
  
  return normalizeDelta({ ops });
}

/**
 * Transform against a sequence of deltas
 * Used when a client needs to catch up with multiple server operations
 */
export function transformAgainstSequence(delta: Delta, deltas: Delta[]): Delta {
  let result = delta;
  
  for (const serverDelta of deltas) {
    result = transform(result, serverDelta, 'right');
  }
  
  return result;
}

/**
 * Check if a delta is a no-op (does nothing)
 */
export function isNoop(delta: Delta): boolean {
  return delta.ops.length === 0 || 
    (delta.ops.length === 1 && delta.ops[0].type === 'retain');
}

/**
 * Get the length change caused by a delta
 */
export function getLengthChange(delta: Delta): number {
  let change = 0;
  
  for (const op of delta.ops) {
    if (op.type === 'insert') {
      change += op.text.length;
    } else if (op.type === 'delete') {
      change -= op.count;
    }
  }
  
  return change;
}

/**
 * Convert position-based operation to delta
 * Useful for converting simple insert/delete to delta format
 */
export function positionToDelta(
  position: number,
  operation: { type: 'insert'; text: string } | { type: 'delete'; length: number },
  docLength: number
): Delta {
  const ops: DeltaOp[] = [];
  
  // Retain up to position
  if (position > 0) {
    ops.push({ type: 'retain', count: position });
  }
  
  // Perform operation
  if (operation.type === 'insert') {
    ops.push({ type: 'insert', text: operation.text });
    // Retain rest of document
    const remaining = docLength - position;
    if (remaining > 0) {
      ops.push({ type: 'retain', count: remaining });
    }
  } else {
    ops.push({ type: 'delete', count: operation.length });
    // Retain rest of document
    const remaining = docLength - position - operation.length;
    if (remaining > 0) {
      ops.push({ type: 'retain', count: remaining });
    }
  }
  
  return normalizeDelta({ ops });
}