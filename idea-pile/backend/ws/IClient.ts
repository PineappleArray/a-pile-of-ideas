/**
 * IClientConnection.ts
 */

import { Delta } from '../../delta/delta';

export interface IClientConnection {
  setUserId(userId: string): void;
  getUserId(): string | undefined;
  setDocumentId(documentId: string): void;
  getDocumentId(): string | undefined;
  send(message: any): void;
  sendError(error: string): void;
  sendDelta(delta: Delta, version: number, author: string): void;
  sendUserJoined(userId: string): void;
  sendUserLeft(userId: string): void;
  sendCursorUpdate(userId: string, cursor: { line: number; ch: number }): void;
  close(): void;
  isOpen(): boolean;
}