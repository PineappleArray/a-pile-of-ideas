import { MongoClient, Db, Collection } from 'mongodb';

export interface Snapshot {
  content: string;
  version: number;
  timestamp: number;
}

export interface SnapshotStore {
  save(documentId: string, snapshot: Snapshot): Promise<void>;
  load(documentId: string): Promise<Snapshot | null>;
  delete(documentId: string): Promise<void>;
}

// MongoDB document structure
interface SnapshotDocument {
  documentId: string;
  content: string;
  version: number;
  timestamp: number;
  updatedAt: Date;
}

export class MongoSnapshotStore implements SnapshotStore {
  private collection: Collection<SnapshotDocument>;

  constructor(db: Db) {
    this.collection = db.collection<SnapshotDocument>('snapshots');
    this.createIndexes();
  }

  // Create indexes for fast lookups
  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ documentId: 1 }, { unique: true });
      await this.collection.createIndex({ updatedAt: 1 });
    } catch (error) {
      console.error('Failed to create indexes:', error);
    }
  }

  async save(documentId: string, snapshot: Snapshot): Promise<void> {
    await this.collection.updateOne(
      { documentId },
      {
        $set: {
          documentId,
          content: snapshot.content,
          version: snapshot.version,
          timestamp: snapshot.timestamp,
          updatedAt: new Date()
        }
      },
      { upsert: true }  // Insert if doesn't exist, update if exists
    );
  }

  async load(documentId: string): Promise<Snapshot | null> {
    const doc = await this.collection.findOne({ documentId });

    if (!doc) {
      return null;
    }

    return {
      content: doc.content,
      version: doc.version,
      timestamp: doc.timestamp
    };
  }

  async delete(documentId: string): Promise<void> {
    await this.collection.deleteOne({ documentId });
  }
}
