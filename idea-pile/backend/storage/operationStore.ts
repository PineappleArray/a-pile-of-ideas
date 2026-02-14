/**
 * Implement storage for operation history
 * 
 * This stores:
 * - All operations for each document
 * - Allows retrieval of operations by version range
*/

import Redis from "ioredis";
import { Delta } from "../../delta/deltaUtil"

export interface StoredOperation {
  documentId: string;
  version: number;
  delta: Delta;  // The actual operation/delta
  timestamp: number;
  author: string; //userId
}

export interface OperationStore {

  save(operation: StoredOperation): Promise<void>;
  
  getOperationsSince(
    documentId: string,
    sinceVersion: number
  ): Promise<StoredOperation[]>;
  
  delete(documentId: string): Promise<void>;

  getCount(documentId: string): Promise<number>;
}


export class RedisOperationStore implements OperationStore {
  private redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT || 6379),
    }); 
  }
  
  //adds an operation to redis
  async save(operation: StoredOperation): Promise<void> {
    const key = `ops:${operation.documentId}`;
    
    //store all the info
    await this.redis.rpush(key, JSON.stringify({
      version: operation.version,
      operation: operation.delta,
      timestamp: operation.timestamp,
      author: operation.author
    }));

    //expires within 24hrs or 200 edits
    await this.redis.ltrim(key, -200, -1);
    await this.redis.expire(key, 86400);
  }
  
  //returns ops since a version
  async getOperationsSince(documentId: string, sinceVersion: number): Promise<StoredOperation[]> {
    const key = `ops:${documentId}`;
    const res = await this.redis.lrange(key, 0, -1);
    const toReturn = [];
    if(res){
      for(const r of res){
        if(JSON.parse(r).version > sinceVersion){
          toReturn.push(JSON.parse(r));
        }
      }
      return toReturn;
    } else {
      throw new Error("KEY VALUE PAIR NOT FOUND: "+documentId);
    }
  }
  
  //deletes a doc for cleaning up
  async delete(documentId: string): Promise<void> {
    await this.redis.del(`ops:${documentId}`);
  }
  
  //returns count
  async getCount(documentId: string): Promise<number> {
    const key = `ops:${documentId}`;
    const res = await this.redis.lrange(key, 0, -1);
    return res.length;
  }
}
/*
export class TrimmingOperationStore implements OperationStore {
  private store: OperationStore;
  private maxOperations: number;
  

  constructor(store: OperationStore, maxOperations: number = 1000) {
    // TODO: Implement
    throw new Error('Not implemented');
  }
  

  async save(operation: StoredOperation): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }
  

  async getOperationsSince(
    documentId: string,
    sinceVersion: number
  ): Promise<StoredOperation[]> {
    // TODO: Implement - just call underlying store
    throw new Error('Not implemented');
  }
  

  async delete(documentId: string): Promise<void> {
    // TODO: Implement - just call underlying store
    throw new Error('Not implemented');
  }
  

  async getCount(documentId: string): Promise<number> {
    // TODO: Implement - just call underlying store
    throw new Error('Not implemented');
  }
}
  */