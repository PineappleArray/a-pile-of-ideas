/**
 * This stores:
 * - All operations for each document
 * - Allows retrieval of operations by version range
*/

import Redis from "ioredis";
import { Delta } from "../../delta/delta"

export interface StoredOperation {
  documentId: string;
  version: number;
  delta: Delta;  //the actual operation/delta
  timestamp: number;
  author: string; //userId
}

//interface for InMemory testing
export interface OperationStore {
  save(operation: StoredOperation): Promise<void>;
  getOperationsSince(documentId: string, sinceVersion: number): Promise<StoredOperation[]>;
  delete(documentId: string): Promise<void>;
  getCount(documentId: string): Promise<number>;
}

export class RedisOperationStore implements OperationStore {
  private redis: Redis;
  
  //initializes the Redis client with connection settings, using environment variables for configuration and defaulting to localhost and port 6379
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',  
      port: Number(process.env.REDIS_PORT || 6379),
      db: process.env.NODE_ENV === 'test' ? 1 : 0  
    }); 
  }
  
  //adds an operation to redis
  async save(operation: StoredOperation): Promise<void> {
    const key = `ops:${operation.documentId}`;
    

    await this.redis.rpush(key, JSON.stringify({
      version: operation.version,
      delta: operation.delta, 
      timestamp: operation.timestamp,
      author: operation.author
    }));

    console.log(`Saved operation for document ${operation.documentId} at version ${operation.version}`);

    //expires within 24hrs or 200 edits
    await this.redis.ltrim(key, -200, -1);
    await this.redis.expire(key, 86400);
  }
  
  //returns ops since a version
  async getOperationsSince(documentId: string, sinceVersion: number): Promise<StoredOperation[]> {
    const key = `ops:${documentId}`;
    const res = await this.redis.lrange(key, 0, -1);
    
    if (!res || res.length === 0) {
      return [];
    }
    
    return res
      .map((r: string) => {
        const parsed = JSON.parse(r);
        return {
          documentId, 
          version: parsed.version,
          delta: parsed.delta,
          timestamp: parsed.timestamp,
          author: parsed.author
        };
      })
      .filter(op => op.version > sinceVersion);
  }
  
  //deletes a doc for cleaning up
  async delete(documentId: string): Promise<void> {
    await this.redis.del(`ops:${documentId}`);
  }
  
  //returns count
  async getCount(documentId: string): Promise<number> {
    const key = `ops:${documentId}`;
    return await this.redis.llen(key); 
  }

  //closes redis connection and is used for cleanup after tests
  async shutdown(): Promise<void> {
    await this.redis.quit();
  }

  async clear(): Promise<void> {
    const pattern = `ops:*`; 
    const keys = await this.redis.keys(pattern);
    console.log(`Clearing ${keys.length} keys from Redis...`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async flushAll(): Promise<void> {
    await this.redis.flushdb();
  }
  
  //get all operations for a document (for debugging)
  async getAll(documentId: string): Promise<StoredOperation[]> {
    return this.getOperationsSince(documentId, -1);
  }
  
  //check if key exists
  async exists(documentId: string): Promise<boolean> {
    const exists = await this.redis.exists(`ops:${documentId}`);
    return exists === 1;
  }
  
  //get all document IDs
  async getAllDocumentIds(): Promise<string[]> {
    const keys = await this.redis.keys('ops:*');
    return keys.map(key => key.replace('ops:', ''));
  }
  
  //get stats for debugging
  async getStats(): Promise<{ totalKeys: number; totalOperations: number }> {
    const keys = await this.redis.keys('ops:*');
    let totalOperations = 0;
    
    for (const key of keys) {
      const count = await this.redis.llen(key);
      totalOperations += count;
    }
    
    return {
      totalKeys: keys.length,
      totalOperations
    };
  }
}
