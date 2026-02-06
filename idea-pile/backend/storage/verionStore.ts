getVersion(docId: string): Promise<number>;
setVersion(docId: string, version: number): Promise<void>;
increment(docId: string): Promise<number>;
