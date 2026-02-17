/**
 * This manages:
 * - Multiple documents (each with its own session)
 * - Routing users to the correct document
 * - Creating/destroying sessions
 * - Snapshots and persistence
 * - Cleanup of empty sessions
 */

import { DocumentSession } from './documentSession';
import { transform, apply } from '../ot/operationalTransformation';
import { ClientConnection } from '../ws/clientConnection';
import { IClientConnection } from '../ws/IClient';
import { OperationStore } from '../storage/operationStore';
import { SnapshotStore } from '../storage/snapshotStore';
import { start } from 'repl';
import { Delta, DeltaMessage } from '../../delta/delta'
import { Session } from 'inspector/promises';

export interface DocumentManagerConfig {
  operationStore?: OperationStore;
  snapshotStore?: SnapshotStore;
  snapshotInterval?: number;  // Create snapshot every N operations
  sessionTimeout?: number;    // Clean up empty sessions after N ms
}

export interface Stats {
  totalSessions: number,
  totalUsers: number,
  sessions: Session[]
}

export class DocumentManager {
  private sessions: Map<string, DocumentSession>;
  private userToDocument: Map<string, string>;
  private config: DocumentManagerConfig;
  private cleanupInterval?: NodeJS.Timeout;

  //sets up the config and the users linked to documents and the sessions
  constructor(config: DocumentManagerConfig = {}) {
    this.sessions = new Map();
    this.userToDocument = new Map();
  
    this.config = {
        snapshotInterval: 100,
        sessionTimeout: 5 * 60 * 1000,
        ...config
    };

    this.startCleanup();
  }

  //get or create a document session
  public async getOrCreateSession(documentId: string, initialContent?: string): Promise<DocumentSession> {
    if(this.sessions.has(documentId)){
      console.log("HAS DOCUMENT")
      return this.sessions.get(documentId)!;
    } else {
      let content = initialContent || '';
      if(this.config.snapshotStore && !initialContent) {
          const snap = await this.config.snapshotStore.load(documentId);
          if(snap){
            content = snap.content; 
            console.log(`Loaded snapshot for ${documentId}`);
          }
      }
      const session = new DocumentSession(documentId, content);
      this.sessions.set(documentId, session);
      return session;
    }
  }

  //joins a user to a document session, connection point for users
  public async joinSession(documentId: string, userId: string, connection: IClientConnection, initialContent?: string): Promise<DocumentSession> {
    await this.leaveSession(userId);
    const session = await this.getOrCreateSession(documentId, initialContent);
    session.addUser(userId, connection);
    this.userToDocument.set(userId, documentId);
  return session;
  }

  //removes a user from the session and saves a snapshot if no users are left
  public async leaveSession(userId: string): Promise<void> {
    const docId = this.userToDocument.get(userId);
    if(!docId){
        return;
    }
    
    const session = this.sessions.get(docId);
    if(session){
        session.removeUser(userId);
        if(session.getUserCount() === 0){
            await this.saveSnapshot(docId, session); 
        }
    }
    this.userToDocument.delete(userId);
  }

//Handle an operation from a user
public async handleOperation(userId: string, message: DeltaMessage): Promise<{ version: number; delta: Delta } | null> { 
  const documentId = this.userToDocument.get(userId);
  if (!documentId) {
    throw new Error(`User ${userId} is not in any session`);
  }
  const session = this.sessions.get(documentId);
  if (!session) {
    throw new Error(`Session ${documentId} not found`);
  }
  const result = session.applyDelta(userId, message);
  if (result && this.config.snapshotInterval &&
      result.version % this.config.snapshotInterval === 0) {
    await this.saveSnapshot(documentId, session);   //js is single threaded so no need for locks
  }
  console.log(`Handled operation for user ${userId} on document ${documentId}, new delta: ${result?.delta.ops}`);
  return result;
}

  //update a user's cursor position
  public updateCursor(userId: string, cursor: { line: number; ch: number }): void {
    const docId = this.userToDocument.get(userId);
    if(docId){
        this.getSession(docId)?.updateCursor(userId, cursor);
    }
  }

  //returns session related to docID
  public getSession(documentId: string): DocumentSession | undefined {
    return this.sessions.get(documentId);
  }

  //returns all active sessions
  public getAllSessions(): Array<ReturnType<DocumentSession['getState']>> {
    const arr = [];
    for(const value of this.sessions.values()){
        arr.push(value.getState())
    }
    return arr;
  }

  //send the doc id that a user is connected to
  public getUserDocument(userId: string): string | undefined {
    return this.userToDocument.get(userId);
  }

  //check if a document has an active session
   public hasActiveSession(documentId: string): boolean {
    return this.sessions.has(documentId);
  }

  //returns total users in sessions
  public getTotalUserCount(): number {
    return this.userToDocument.size;
  }

  //saves a snapshot to storage
  //private helper to persist document state.
  private async saveSnapshot(documentId: string, session: DocumentSession): Promise<void> {
    if (!this.config.snapshotStore) {
        return; 
    }
    await this.config.snapshotStore.save(documentId, {
        content: session.getContent(),
        version: session.getVersion(),
        timestamp: Date.now()
    });
  }

  //checks for empty sessions and removes them
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      //console.log('Running cleanup...');
      
      for (const [documentId, session] of this.sessions) {
        if (session.getUserCount() === 0) {
          this.sessions.delete(documentId);
        }
      }
    }, 60000); //1 minute
  }

//stops the cleaner after shutdown
public async shutdown(): Promise<void> {
    //stop cleanup
    if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = undefined;
    }
    
    //save all sessions
    const savePromises = Array.from(this.sessions.entries()).map(
        ([documentId, session]) => this.saveSnapshot(documentId, session)
    );
    
    await Promise.all(savePromises);
    //console.log(`Shutdown complete. Saved ${savePromises.length} snapshots.`);
}

  //manually saves the document
  public async saveDocument(documentId: string): Promise<void> {
    const session = this.sessions.get(documentId);
    if(session){
        await this.config.snapshotStore?.save(documentId, {content: session.getContent(), version: session.getVersion(), timestamp: Date.now()})
    }
  }

  //get stats about the manager
  public getStats() {
    return {totalSessions: this.sessions.size, totalUsers: this.userToDocument.size, sessions: this.getAllSessions()}
  }
}

