// types.ts

export type Operation =
  | InsertTextOperation
  | DeleteTextOperation
  | CreateTextBoxOperation
  | DeleteTextBoxOperation
  | MoveTextBoxOperation
  | ResizeTextBoxOperation;

export interface InsertTextOperation {
  type: 'insert_text';
  textBoxId: string;
  position: number;
  content: string;
}

export interface DeleteTextOperation {
  type: 'delete_text';
  textBoxId: string;
  position: number;
  length: number;
  deletedContent: string;
}

export interface CreateTextBoxOperation {
  type: 'create_textbox';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  initialContent?: string;
}

export interface DeleteTextBoxOperation {
  type: 'delete_textbox';
  id: string;
  state: {
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
  };
}

export interface MoveTextBoxOperation {
  type: 'move_textbox';
  id: string;
  oldX: number;
  oldY: number;
  newX: number;
  newY: number;
}

export interface ResizeTextBoxOperation {
  type: 'resize_textbox';
  id: string;
  oldWidth: number;
  oldHeight: number;
  newWidth: number;
  newHeight: number;
}

export interface Delta {
  timestamp: number;
  userId: string;
  operations: Operation[];
}