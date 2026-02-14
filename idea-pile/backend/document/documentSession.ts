import { Delta, DeltaMessage, Version, normalizeDelta, DeltaOp } from '../../delta/deltaUtil'; // adjust path
import { transform, apply, compose, transformAgainstSequence } from '../ot/operationalTransformation';
import { ClientConnection } from '../ws/clientConnection';
import { IClientConnection } from '../ws/IClient';

//This manages: multiple users editing the same document, transforming operations from different users
//broadcasting changes to all connected users, version tracking

export interface User {
  connection: IClientConnection;
  userId: string;
  version: number;  //What version of the document this user has
  joinedAt: number;
  cursor: { line: number; ch: number } | null;
}

export interface HistoricalDelta {
  delta: Delta;
  version: number;
  timestamp: number;
  author: string;
}

export class DocumentSession {
  private documentId: string;
  private content: string;
  private version: number;
  private users: Map<string, User>;
  private deltaHistory: HistoricalDelta[];
  private maxHistorySize: number;

  //Makes a base document from the id and the content
  constructor(documentId: string, initialContent: string = '') {
    this.documentId = documentId;
    this.version = 0;
    this.users = new Map();
    this.deltaHistory = [];
    this.content = initialContent;
    this.maxHistorySize = 1000;
  }

  //adds a user to the document and then informs the others of the user being added
  public addUser(userId: string, connection: IClientConnection): void {
    console.log("ADDED: -" + userId + "-");
    
    this.users.set(userId, {
      connection, 
      userId, 
      version: this.version, 
      joinedAt: Date.now(), 
      cursor: null
    });
    
    //send init message to the new user
    connection.send({
      type: 'init',
      content: this.content,
      version: this.version,
      users: this.getUsers()
    });
    
    //notify other users
    this.broadcastToOthers(userId, {
      type: 'user-joined',
      userId
    });
  }

  //tells if users have left the document and returns true if the doc is empty
  public removeUser(userId: string): boolean {
    this.users.delete(userId);
    
    //notify other users
    this.broadcast({
      type: 'user-left',
      userId
    });
    
    return this.users.size === 0;
  }

  //apply a delta operation from a client
  public applyDelta(userId: string, message: DeltaMessage): { version: number; delta: Delta } | null {
    const user = this.users.get(userId);

    if (!user) {
      throw new Error("INVALID USER ID");
    }
    
    //normalize the incoming delta
    const delta = normalizeDelta({ops: message.ops});
    
    //transform against any operations that happened after user's base version
    const transformed = this.transformDelta(delta, message.baseVersion, this.version);
    
    if (!transformed) {
      console.error('Transformation failed');
      return null;
    }
    
    console.log('Transformed delta:', transformed);
    
    this.content = apply(this.content, transformed);

    this.version++;
    
    this.deltaHistory.push({
      delta: transformed,
      version: this.version,
      author: userId,
      timestamp: Date.now()
    });
    
    user.version = this.version;
    
    this.broadcastDelta(transformed, this.version, userId);
    
    //trim history if needed
    if (this.deltaHistory.length > this.maxHistorySize) {
      this.trimHistory();
    }
    
    return {version: this.version, delta: transformed};
  }

  //transform a delta against operations in history
  private transformDelta(delta: Delta, baseVersion: number, currentVersion: number): Delta | null {
    // If client is already at current version, no transformation needed
    if (baseVersion === currentVersion) {
      return delta;
    }
    
    //validate version numbers
    if (baseVersion > currentVersion) {
      console.error('Base version is ahead of current version');
      return null;
    }
    
    //get operations between baseVersion and currentVersion
    const ops = this.deltaHistory.filter(
      h => h.version > baseVersion && h.version <= currentVersion
    );
    
    const histList: Delta[] = ops.map(op => op.delta);
    
    //transform against sequence
    return transformAgainstSequence(delta, histList);
  }

  //broadcasts a delta to all users except the author
  private broadcastDelta(delta: Delta, version: number, excludeUserId: string): void {
    for (const [userId, user] of this.users) {
      if (userId !== excludeUserId) {
        user.connection.sendDelta(delta, version, excludeUserId);
      }
    }
  }

  //this will return the edits since the version that was inputed
  public getDeltasSince(version: number): HistoricalDelta[] {
    return this.deltaHistory.filter(
      h => h.version > version
    );
  }

  //this will send a cursor of a user to the rest of the users
  public updateCursor(userId: string, cursor: { line: number; ch: number }): void {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new Error("INVALID USERID, USERID NOT FOUND");
    }
    
    user.cursor = cursor;
    
    //broadcasts cursor update
    this.broadcastToOthers(userId, {
      type: 'cursor',
      userId,
      cursor
    });
  }

  //gets array of user IDs currently in this session
  public getUsers(): string[] {
    return Array.from(this.users.keys());
  }

  //sends a message of any type to a user
  private sendToUser(userId: string, message: any): void {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new Error("INVALID USERID, USERID NOT FOUND");
    }
    
    if (user.connection) {
      user.connection.send(message);
    } else {
      throw new Error(userId + " MISSING COMMUNICATION");
    }
  }

  //sends a message to all other clients except the one excluded
  //used for informing all other users about the excluded users actions
  private broadcastToOthers(excludeUserId: string, message: any): void {
    for (const [userId, user] of this.users) {
      if (userId !== excludeUserId) {
        user.connection.send(message);
      }
    }
  }

  //send a message to every user
  private broadcast(message: any): void {
    for (const user of this.users.values()) {
      user.connection.send(message);
    }
  }

  //returns all the info about a document
  public getState() {
    return {
      documentId: this.documentId,
      version: this.version,
      userCount: this.users.size,
      contentLength: this.content.length,
      users: Array.from(this.users.values()).map(u => ({
        userId: u.userId,
        version: u.version,
        joinedAt: u.joinedAt,
        cursor: u.cursor
      }))
    };
  }

  //returns content
  public getContent(): string {
    return this.content;
  }

  //returns version
  public getVersion(): number {
    return this.version;
  }

  //returns doc id
  public getDocumentId(): string {
    return this.documentId;
  }

  //checks if user is in the map
  public hasUser(userId: string): boolean {
    return this.users.has(userId);
  }

  //returns users in session
  public getUserCount(): number {
    return this.users.size;
  }

  //rebuild document content from history and is useful for recovering state or debugging
  public rebuildFromHistory(initialContent: string): string {
    let content = initialContent;
    
    //apply each delta in order
    for (const historical of this.deltaHistory) {
      content = apply(content, historical.delta);
    }
    
    return content;
  }

  //keep history size manageable by removing old deltas
  private trimHistory(): void {
    if (this.deltaHistory.length > this.maxHistorySize) {
      const toRemove = this.deltaHistory.length - this.maxHistorySize;
      this.deltaHistory.splice(0, toRemove);
      console.log(`Trimmed ${toRemove} old deltas from history`);
    }
  }
}