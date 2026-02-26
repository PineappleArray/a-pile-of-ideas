//~

//3 types where they each represent an action that the users takes in term of text
//This is formated in a way where it will be the action and then the number of characters
//that the action is impacting so RETAIN(10), DELETE(5) would retain the first 10 characters
//of a string before deleting the 5 subsequent characters
export type DeltaOp = 
  | { type: 'retain'; count: number; }
  | { type: 'insert'; text: string; attributes?: Record<string, any> }
  | { type: 'delete'; count: number };

//these are the operations that are executed on the textbox
export type TransformOp =
  | { type: 'move'; dx: number; dy: number } //dx and dy is relative due to intent overriding
  | { type: 'resize'; dw: number; dh: number } 

//holds the list of transforms
export interface Transform{
  ops: TransformOp[];
}

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

export interface BaseMessage {
  docId: string; //a unique id for this edit that is used to track it across the system
  stickyId: string;
  baseVersion: number;
  type: string;
}

//a edit on a sticky note in doc
export interface DeltaMessage extends BaseMessage {
  type: 'delta';
  ops: DeltaOp[];
}

export interface TransformMessage extends BaseMessage {
  type: 'transform';
  ops: TransformOp[];
}

export type Message = DeltaMessage | TransformMessage;

//merges multiple edits if they are the same type
//to save space
export function normalizeDelta(delta: Delta): Delta{
  const toReturn: DeltaOp[] = [];
  
  for(const op of delta.ops){
    const lastOp = toReturn[toReturn.length - 1];

    if(!lastOp){
      toReturn.push({...op})
    } else {
      if (op.type == 'retain' && lastOp.type == 'retain') {
        lastOp.count += op.count;
      } else if (op.type == 'delete' && lastOp.type == 'delete') {
        lastOp.count += op.count;
      } else if (op.type == 'insert' && lastOp.type == 'insert') {
        lastOp.text += op.text;
      } else {
        toReturn.push({ ...op });
      }
    }
  }
  return {ops: toReturn};
}

//insures that the deltaop values are valid
export function validateData(deltaOp: DeltaOp): void{
  if((deltaOp.type == "retain" || deltaOp.type == "delete") && deltaOp.count < 0){
    throw new Error("INVALID RETAIN OR DELETE LENGTH <0")
  } else if(deltaOp.type == "insert" && deltaOp.text.length == 0){
    throw new Error("INVALID INSERT LENGTH TEXT IS EMPTY")
  }
}

//merges multiple edits if they are the same type
//to save space
export function normalizeTransform(transform: Transform): Transform{
  const toReturn: TransformOp[] = [];
  
  for(const op of transform.ops){
    const lastOp = toReturn[toReturn.length - 1];

    if(!lastOp){
      toReturn.push({...op})
    } else {
      if (op.type == 'move' && lastOp.type == 'move') {
        lastOp.dx += op.dx;
        lastOp.dy += op.dy;
      } else if (op.type == 'resize' && lastOp.type == 'resize') {
        lastOp.dh += op.dh;
        lastOp.dw += op.dw;
      } else {
        toReturn.push({ ...op });
      }
    }
  }
  return {ops: toReturn};
}

//IMPLEMENT TS LATER
//insures that the deltaop values are valid
export function validateTransform(deltaOp: DeltaOp): void{
  if((deltaOp.type == "retain" || deltaOp.type == "delete") && deltaOp.count < 0){
    throw new Error("INVALID RETAIN OR DELETE LENGTH <0")
  } else if(deltaOp.type == "insert" && deltaOp.text.length == 0){
    throw new Error("INVALID INSERT LENGTH TEXT IS EMPTY")
  }
}