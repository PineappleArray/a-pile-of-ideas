//~
import { diffChars } from 'diff'; 

//3 types where they each represent an action that the users takes in term of text
//This is formated in a way where it will be the action and then the number of characters
//that the action is impacting so RETAIN(10), DELETE(5) would retain the first 10 characters
//of a string before deleting the 5 subsequent characters
export type DeltaOp = 
  | { type: 'retain'; count: number }
  | { type: 'insert'; text: string; attributes?: Record<string, any> }
  | { type: 'delete'; count: number };

//This will store a list of all the operations that were performed 
//in sequential order so that the original value can be found by
//reversing these operations
export interface Delta {
  ops: DeltaOp[];
}

//This acts as a sort of json with metadata of a snapshot as it stores all of the information
//related to the edit
export interface Version {
  id: string;
  timestamp: number;
  author: string;
  parentId: string | null;
  delta: Delta | null;
  snapshot: string | null; 
  description?: string;
  isSnapshot: boolean;
}

//This will store the versions and will prepare them for snapshot compression
//to save space and traversal time
export interface VersionStore {
  versions: Map<string, Version>;
  currentVersionId: string;
  snapshotInterval: number;
}

export class DeltaEngine {
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

  // Compute delta between two texts 
  static diff(oldText: string, newText: string): Delta {
    const ops: DeltaOp[] = [];
    
    const difference = diffChars(oldText, newText);

    //Iterates through the list of differences
    for(const d of difference){
      const {value, added, removed} = d

      if (added){
        ops.push({type: 'insert', text: value})
      } else if(removed){
        ops.push({type: 'delete', count: value.length})
      } else {
        ops.push({type: 'retain', count: value.length})
      }
    }
    return { ops };
  }

  // Invert a delta to undo a change
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

  static toString (delta: Delta) {
    for (const c of delta.ops){
      console.log("value:", c.type);
    }
    console.log("____________")
  }
}
