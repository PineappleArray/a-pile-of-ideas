import { MongoClient, Collection, Db } from "mongodb";

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

//MongoDB document structure
interface SnapshotDocument {
  documentId: string;
  content: string;
  version: number;
  timestamp: number;
  updatedAt: Date;
}

export class MongoSnapshotStore implements SnapshotStore {
  private client!: MongoClient;
  private db!: Db; 
  private collection!: Collection<SnapshotDocument>;

  private constructor() {}

  //creates a new instance of the db
  //change after testing
  static async create(mongoUrl: string = "mongodb://localhost:27017",dbName: string = "ot-test-db"): Promise<MongoSnapshotStore> {
    const store = new MongoSnapshotStore();
    await store.init(mongoUrl, dbName);
    return store;
  }

  private async init(mongoUrl: string, dbName: string): Promise<void> {
    this.client = new MongoClient(mongoUrl);
    await this.client.connect();

    this.db = this.client.db(dbName); 
    this.collection = this.db.collection<SnapshotDocument>("snapshots");

    await this.createIndexes();
  }

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

  async clear(): Promise<void> {
    await this.collection.deleteMany({});
  }

  async dropCollection(): Promise<void> {
    try {
      await this.collection.drop();
    } catch (error: any) {
      // Ignore error if collection doesn't exist
      if (error.code !== 26) {  // 26 = NamespaceNotFound
        throw error;
      }
    }
  }

  async dropDatabase(): Promise<void> {
    await this.db.dropDatabase();
  }

  async count(): Promise<number> {
    return await this.collection.countDocuments();
  }

  async getAll(): Promise<SnapshotDocument[]> {
    return await this.collection.find({}).toArray();
  }

  async shutdown(): Promise<void> {
    await this.client.close();
  }
}