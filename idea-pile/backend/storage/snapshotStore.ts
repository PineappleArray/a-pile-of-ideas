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

export class DatabaseSnapshotStore implements SnapshotStore {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  async save(documentId: string, snapshot: Snapshot): Promise<void> {
    await this.db.query(
      `INSERT INTO snapshots (document_id, content, version, timestamp)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = ?, version = ?, timestamp = ?`,
      [
        documentId,
        snapshot.content,
        snapshot.version,
        snapshot.timestamp,
        snapshot.content,
        snapshot.version,
        snapshot.timestamp
      ]
    );
  }

  async load(documentId: string): Promise<Snapshot | null> {
    const rows = await this.db.query(
      'SELECT content, version, timestamp FROM snapshots WHERE document_id = ?',
      [documentId]
    );

    if (rows.length === 0) return null;

    return {
      content: rows[0].content,
      version: rows[0].version,
      timestamp: rows[0].timestamp
    };
  }

  async delete(documentId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM snapshots WHERE document_id = ?',
      [documentId]
    );
  }
}