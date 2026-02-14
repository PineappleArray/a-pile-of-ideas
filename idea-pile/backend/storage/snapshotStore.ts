import { MongoClient, Collection } from "mongodb";

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
  private collection!: Collection<SnapshotDocument>;

  private constructor() {}

  /** Factory method (async-safe) */
  static async create(): Promise<MongoSnapshotStore> {
    const store = new MongoSnapshotStore();
    await store.init();
    return store;
  }

  private async init(): Promise<void> {
    const client = new MongoClient("mongodb://localhost:27017");
    await client.connect();

    const db = client.db("your_db_name");
    this.collection = db.collection<SnapshotDocument>("snapshots");

    await this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    await this.collection.createIndex({ documentId: 1 }, { unique: true });
    await this.collection.createIndex({ updatedAt: 1 });
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
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  async load(documentId: string): Promise<Snapshot | null> {
    const doc = await this.collection.findOne({ documentId });
    if (!doc) return null;

    return {
      content: doc.content,
      version: doc.version,
      timestamp: doc.timestamp,
    };
  }

  async delete(documentId: string): Promise<void> {
    await this.collection.deleteOne({ documentId });
  }
}

