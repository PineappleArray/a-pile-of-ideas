//Represents a single WebSocket connection to a client

import { WebSocket } from 'ws';
import { Delta } from '../../delta/delta';

export class ClientConnection {
  private ws: WebSocket;
  private userId?: string;
  private documentId?: string;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  //Sets the user ID for this connection
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  //Get the user ID for this connection
  public getUserId(): string | undefined {
    return this.userId;
  }

  //Set the document ID for this connection
  public setDocumentId(documentId: string): void {
    this.documentId = documentId;
  }

  //Get the document ID for this connection
  public getDocumentId(): string | undefined {
    return this.documentId;
  }

  //Send a message to the client
  public send(message: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  //Send an error message to the client
  public sendError(error: string): void {
    this.send({
      type: 'error',
      error
    });
  }

  //Send a delta operation to the client
  public sendDelta(delta: Delta, version: number, author: string): void {
    this.send({
      type: 'delta',
      delta,
      version,
      author
    });
  }

  //Send user joined notification
  public sendUserJoined(userId: string): void {
    this.send({
      type: 'user-joined',
      userId
    });
  }

  //Send user left notification
  public sendUserLeft(userId: string): void {
    this.send({
      type: 'user-left',
      userId
    });
  }

  //Send cursor update
  public sendCursorUpdate(userId: string, cursor: { line: number; ch: number }): void {
    this.send({
      type: 'cursor',
      userId,
      cursor
    });
  }

  //Close the connection
  public close(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  //Check if connection is open
  public isOpen(): boolean {
    return this.ws.readyState === WebSocket.OPEN;
  }
}