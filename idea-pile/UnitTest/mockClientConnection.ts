/**
 * MockClientConnection.ts
 * 
 * Mock implementation of ClientConnection for testing
 * No real WebSocket required!
 */

import { IClientConnection } from '@/backend/ws/IClient';
import { Delta } from '../delta/delta';

export class MockClientConnection implements IClientConnection{
  public messages: any[] = [];
  private userId?: string;
  private documentId?: string;
  private _isOpen: boolean = true;

  constructor() {
    // Mock connection
  }
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getUserId(): string | undefined {
    return this.userId;
  }

  public setDocumentId(documentId: string): void {
    this.documentId = documentId;
  }

  public getDocumentId(): string | undefined {
    return this.documentId;
  }

  public send(message: any): void {
    if (this._isOpen) {
      this.messages.push(message);
    }
  }

  public sendError(error: string): void {
    this.send({ type: 'error', error });
  }

  public sendDelta(delta: Delta, version: number, author: string): void {
    this.send({ type: 'delta', delta, version, author });
  }

  public sendUserJoined(userId: string): void {
    this.send({ type: 'user-joined', userId });
  }

  public sendUserLeft(userId: string): void {
    this.send({ type: 'user-left', userId });
  }

  public sendCursorUpdate(userId: string, cursor: { line: number; ch: number }): void {
    this.send({ type: 'cursor', userId, cursor });
  }

  public close(): void {
    this._isOpen = false;
  }

  public isOpen(): boolean {
    return this._isOpen;
  }

  // Test helper methods
  public clearMessages(): void {
    this.messages = [];
  }

  public getMessagesByType(type: string): any[] {
    return this.messages.filter(m => m.type === type);
  }

  public getLastMessage(): any | undefined {
    return this.messages[this.messages.length - 1];
  }
}