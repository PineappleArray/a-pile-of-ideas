import { Delta, DeltaOp, normalizeDelta } from '../../delta/delta'; 

export function transform(deltaA: Delta, deltaB: Delta, priority: 'left' | 'right' = 'right'): Delta {
  const result: DeltaOp[] = [];
  
  let i = 0, j = 0;
  const opsA = deltaA.ops;
  const opsB = deltaB.ops;
  
  //helper to copy operation
  function copyOp(op: DeltaOp): DeltaOp {
    if (op.type === 'insert') {
      return { ...op };
    } else {
      return { ...op };
    }
  }
  
  let currentA: DeltaOp | null = i < opsA.length ? copyOp(opsA[i]) : null;
  let currentB: DeltaOp | null = j < opsB.length ? copyOp(opsB[j]) : null;
  
  while (currentA || currentB) {
    //just B remains
    if (!currentA) {
      if (currentB && currentB!.type === 'insert') {
        result.push({ type: 'retain', count: currentB.text.length });
      }
      j++;
      currentB = j < opsB.length ? copyOp(opsB[j]) : null;
      continue;
    }
    
    //just A remains
    if (!currentB) {
      result.push(currentA);
      i++;
      currentA = i < opsA.length ? copyOp(opsA[i]) : null;
      continue;
    }
    
    //both present
    if (currentA.type === 'insert') {
      if (currentB.type === 'insert') {
        if (priority === 'left') {
          result.push(currentA);
          i++;
          currentA = i < opsA.length ? copyOp(opsA[i]) : null;
        } else {
          result.push({ type: 'retain', count: currentB.text.length });
          j++;
          currentB = j < opsB.length ? copyOp(opsB[j]) : null;
        }
      } else {
        result.push(currentA);
        i++;
        currentA = i < opsA.length ? copyOp(opsA[i]) : null;
      }
    } else if (currentA.type === 'retain') {
      if (currentB.type === 'insert') {
        result.push({ type: 'retain', count: currentB.text.length });
        j++;
        currentB = j < opsB.length ? copyOp(opsB[j]) : null;
      } else if (currentB.type === 'retain') {
        const minLen = Math.min(currentA.count, currentB.count);
        result.push({ type: 'retain', count: minLen });
        
        currentA = { type: 'retain', count: currentA.count - minLen };
        currentB = { type: 'retain', count: currentB.count - minLen };
        
        if (currentA.count === 0) {
          i++;
          currentA = i < opsA.length ? copyOp(opsA[i]) : null;
        }
        if (currentB.count === 0) {
          j++;
          currentB = j < opsB.length ? copyOp(opsB[j]) : null;
        }
      } else {
        const minLen = Math.min(currentA.count, currentB.count);
        
        currentA = { type: 'retain', count: currentA.count - minLen };
        currentB = { type: 'delete', count: currentB.count - minLen };
        
        if (currentA.count === 0) {
          i++;
          currentA = i < opsA.length ? copyOp(opsA[i]) : null;
        }
        if (currentB.count === 0) {
          j++;
          currentB = j < opsB.length ? copyOp(opsB[j]) : null;
        }
      }
    } else {
      if (currentB.type === 'insert') {
        result.push({ type: 'retain', count: currentB.text.length });
        j++;
        currentB = j < opsB.length ? copyOp(opsB[j]) : null;
      } else if (currentB.type === 'retain') {
        const minLen = Math.min(currentA.count, currentB.count);
        result.push({ type: 'delete', count: minLen });
        
        currentA = { type: 'delete', count: currentA.count - minLen };
        currentB = { type: 'retain', count: currentB.count - minLen };
        
        if (currentA.count === 0) {
          i++;
          currentA = i < opsA.length ? copyOp(opsA[i]) : null;
        }
        if (currentB.count === 0) {
          j++;
          currentB = j < opsB.length ? copyOp(opsB[j]) : null;
        }
      } else {
        const minLen = Math.min(currentA.count, currentB.count);
        
        currentA = { type: 'delete', count: currentA.count - minLen };
        currentB = { type: 'delete', count: currentB.count - minLen };
        
        if (currentA.count === 0) {
          i++;
          currentA = i < opsA.length ? copyOp(opsA[i]) : null; //important to copy the op here to avoid mutating the original delta
        }
        if (currentB.count === 0) {
          j++;
          currentB = j < opsB.length ? copyOp(opsB[j]) : null;
        }
      }
    }
  }
  
  return { ops: result };
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
    
    //B inserts
    if (opB.type === 'insert') {
      result.push(opB);
      j++;
    }
    
    //A inserts, B retains
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
    
    //A inserts, B deletes
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
    
    //A retains, B retains
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
    
    //A retains, B deletes
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
    
    //A deletes
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

//invert a delta (for undo functionality)
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

//transform against a sequence of deltas
//used when a client needs to catch up with multiple server operations
export function transformAgainstSequence(delta: Delta, deltas: Delta[]): Delta {
  let result = delta;
  
  for (const serverDelta of deltas) {
    result = transform(result, serverDelta, 'right');
  }
  
  return result;
}

//check if a delta has no ops
export function isNoop(delta: Delta): boolean {
  return delta.ops.length === 0 || 
    (delta.ops.length === 1 && delta.ops[0].type === 'retain');
}

//get the length change caused by a delta
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


//convert position-based operation to delta
//useful for converting simple insert/delete to delta format
export function positionToDelta(
  position: number,
  operation: { type: 'insert'; text: string } | { type: 'delete'; length: number },
  docLength: number
): Delta {
  const ops: DeltaOp[] = [];
  
  //retain up to position
  if (position > 0) {
    ops.push({ type: 'retain', count: position });
  }
  
  //perform operation
  if (operation.type === 'insert') {
    ops.push({ type: 'insert', text: operation.text });
    //retain rest of document
    const remaining = docLength - position;
    if (remaining > 0) {
      ops.push({ type: 'retain', count: remaining });
    }
  } else {
    ops.push({ type: 'delete', count: operation.length });
    //retain rest of document
    const remaining = docLength - position - operation.length;
    if (remaining > 0) {
      ops.push({ type: 'retain', count: remaining });
    }
  }
  
  return normalizeDelta({ ops });
}