import { Delta, DeltaMessage, Version, normalizeDelta, DeltaOp } from '../../delta/deltaUtil'; // adjust path
import { transform, apply, compose, transformAgainstSequence } from '../ot/operationalTransformation';
import { ClientConnection } from '../ws/clientConnection';
import { IClientConnection } from '../ws/IClient';
//This manages: multiple users editing the same document, transforming operations from different users
//broadcasting changes to all connected users, version tracking

export interface User {
  connection: IClientConnection;
  userId: string;
  version: number;  // What version of the document this user has
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

  //adds a user to the document and then informers the others of the user being added
  public addUser(userId: string, connection: IClientConnection): void {
    this.users.set(userId, {connection, userId, version: this.version, joinedAt: Date.now(), cursor: null});
    this.sendToUser(userId, "ADDED TO DOC");
    this.broadcastToOthers(userId, "ADDED " + userId + " TO DOCUMENT");
  }

  //tells if users have left the document and returns true if the doc is empty
  public removeUser(userId: string): boolean {
    this.users.delete(userId);
    this.broadcast(userId + " has left the document");
    return this.users.size == 0;
  }

  /**
   * Apply a delta operation from a client
   * 
   * This is the CORE of OT! When a client sends an operation:
   * 1. Get the user who sent it
   * 2. Transform the operation against all operations since the user's base version
   * 3. Apply the transformed operation to the document
   * 4. Increment version
   * 5. Store in history
   * 6. Update user's version
   * 7. Broadcast to other users
   * 
   * @param userId - User who made the edit
   * @param message - Contains baseVersion and ops
   * @returns The new version and transformed delta, or null if invalid
   * 
   * HINT: Use transformDelta() helper to transform against history
   * HINT: Use apply() from DeltaOT to update content
   * HINT: Don't forget to normalize the delta!
   */
  public applyDelta(userId: string, message: DeltaMessage): { version: number; delta: Delta } | null {
    const user = this.users.get(userId);

    if(!user || !user.version){
      throw new Error("INVALID USER ID");
    } else {
      const delta = normalizeDelta({ops: message.ops});
      const transformed = this.transformDelta(delta, user.version, this.version);
      if(!transformed){
        throw new Error("THE TRANSFORMATION IS RETURNING A NULL");
      }
      this.deltaHistory.push({delta: transformed, version: this.version++, author: userId, timestamp: Date.now()})
      return {version: this.version, delta: transformed};
    }
  }

  //transform a delta against operations in history
  private transformDelta(delta: Delta, baseVersion: number, currentVersion: number): Delta | null {
    if(currentVersion == this.version){
      return delta;
    }
    const ops = this.deltaHistory.filter(
        h => h.version > baseVersion && h.version <= currentVersion
      );
      const histList: Delta[] = [] 
      for(const op of ops){
        histList.concat(op.delta)
      }
    return transformAgainstSequence(delta, histList);
  }

  //this will return the edits since the version that was inputed
  public getDeltasSince(version: number): HistoricalDelta[] {
    return this.deltaHistory.filter(
      h=> h.version > version
    );
  }

  //this will send a cursor of a users to the rest of the users
  public updateCursor(userId: string, cursor: { line: number; ch: number }): void {
    const user = this.users.get(userId);
    if(!user){
      throw new Error("INVALID USERID, USERID NOT FOUND");
    } else {
      user.cursor = cursor;
      this.broadcastToOthers(userId, cursor)
    }
  }

  //gets array of user IDs currently in this session
  public getUsers(): string[] {
    return Array.from(this.users.keys());
  }

  //sends a message of any type to a user
  private sendToUser(userId: string, message: any): void {
    const user = this.users.get(userId);
     if(!user){
      throw new Error("INVALID USERID, USERID NOT FOUND");
    } else {
      if(user.connection) {
        user.connection.send(message);
      } else {
        throw new Error(userId+" MISSING COMMUNICATION");
      }
    }
  }

  //sends a message to all other clients except the one excluded
  //used for informing all other users about the excluded users actions
  private broadcastToOthers(excludeUserId: string, message: any): void {
    for(const user in this.users.keys){
      if(user != excludeUserId){
        const connection = this.users.get(user)?.connection;
        if(connection){
          connection.send(message);
        }
      }
    }
  }

  //send a message to every user
  private broadcast(message: any): void {
    for(const user in this.users.keys){
        const connection = this.users.get(user)?.connection;
        if(connection){
          connection.send(message);
        }
    }
  }

  //returns all the info abt a document with: documentId, version, userCount, contentLength, users info
  public getState() {
    return this
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

  //implement later
  public rebuildFromHistory(initialContent: string): string {
    // TODO: Implement
    // Start with initialContent, apply each delta in history
    
    throw new Error('Not implemented');
  }


  //Keep history size manageable by removing old deltas.
 
  //HINT: Check if deltaHistory.length > maxHistorySize
  //HINT: Use array.shift() to remove from front
   
  private trimHistory(): void {
    // TODO: Implement
    // Remove oldest deltas if history is too long
    
    throw new Error('Not implemented');
  }
}