//3 types where they each represent an action that the users takes in term of text
//This is formated in a way where it will be the action and then the number of characters
//that the action is impacting so RETAIN(10), DELETE(5) would retain the first 10 characters
//of a string before deleting the 5 subsequent characters
type DeltaOp = 
  | { type: 'retain'; count: number }
  | { type: 'insert'; text: string; attributes?: Record<string, any> }
  | { type: 'delete'; count: number };

//This will store a list of all the operations that were performed 
interface Delta {
  ops: DeltaOp[];
}

//This acts as a sort of json of a keyframe as it stores all of the information
//related to the edit
interface Version {
  id: string;
  timestamp: number;
  author: string;
  parentId: string | null;
  delta: Delta | null; // null for base snapshots
  snapshot: string | null; // full content for base snapshots
  description?: string;
  isSnapshot: boolean;
}

interface VersionStore {
  versions: Map<string, Version>;
  currentVersionId: string;
  snapshotInterval: number; // Create snapshot every N versions
}

class DeltaEngine {
  // Apply a delta to text
  static apply(text: string, delta: Delta): string {
    let result = '';
    let position = 0;

    for (const op of delta.ops) {
      if (op.type === 'retain') {
        result += text.slice(position, position + op.count);
        position += op.count;
      } else if (op.type === 'insert') {
        result += op.text;
      } else if (op.type === 'delete') {
        position += op.count;
      }
    }

    // Add remaining text
    result += text.slice(position);
    return result;
  }

  // Compute delta between two texts (simplified diff)
  static diff(oldText: string, newText: string): Delta {
    const ops: DeltaOp[] = [];
    
    // Simple character-by-character diff
    let i = 0;
    let j = 0;
    
    while (i < oldText.length || j < newText.length) {
      if (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
        // Characters match - retain
        let count = 0;
        while (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
          count++;
          i++;
          j++;
        }
        ops.push({ type: 'retain', count });
      } else if (j < newText.length && (i >= oldText.length || oldText[i] !== newText[j])) {
        // New character - insert
        let text = '';
        const startJ = j;
        while (j < newText.length && (i >= oldText.length || oldText[i] !== newText[j])) {
          text += newText[j];
          j++;
          // Look ahead to see if we can match again
          if (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
            break;
          }
        }
        if (text) ops.push({ type: 'insert', text });
      } else if (i < oldText.length) {
        // Character deleted
        let count = 0;
        while (i < oldText.length && (j >= newText.length || oldText[i] !== newText[j])) {
          count++;
          i++;
          // Look ahead to see if we can match again
          if (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
            break;
          }
        }
        if (count > 0) ops.push({ type: 'delete', count });
      }
    }

    return { ops };
  }

  // Invert a delta (for undo)
  static invert(delta: Delta, baseText: string): Delta {
    const ops: DeltaOp[] = [];
    let position = 0;

    for (const op of delta.ops) {
      if (op.type === 'retain') {
        ops.push({ type: 'retain', count: op.count });
        position += op.count;
      } else if (op.type === 'insert') {
        ops.push({ type: 'delete', count: op.text.length });
      } else if (op.type === 'delete') {
        const deleted = baseText.slice(position, position + op.count);
        ops.push({ type: 'insert', text: deleted });
        position += op.count;
      }
    }

    return { ops };
  }

  // Compose two deltas
  static compose(delta1: Delta, delta2: Delta): Delta {
    const ops: DeltaOp[] = [];
    let i = 0, j = 0;
    
    // This is a simplified composition
    // Full implementation would handle all edge cases
    while (i < delta1.ops.length || j < delta2.ops.length) {
      const op1 = delta1.ops[i];
      const op2 = delta2.ops[j];
      
      if (!op2) {
        ops.push(op1);
        i++;
      } else if (!op1) {
        ops.push(op2);
        j++;
      } else {
        // Simplified: just concatenate
        ops.push(op1);
        i++;
      }
    }
    
    return { ops };
  }
}
