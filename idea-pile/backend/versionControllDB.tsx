import { VersionStore } from "@/models/deltaUtil";
import { Version } from "@/models/deltaUtil";
import { DeltaEngine } from "@/models/deltaUtil"

class VersionStoreManager{
  private store: VersionStore;

  constructor() {
    this.store = {
      versions: new Map(),
      currentVersionId: '',
      snapshotInterval: 10 // Create snapshot every 10 versions
    };
  }

  // Initialize with base content
  initialize(content: string, author: string): string {
    const versionId = this.generateId();
    const version: Version = {
      id: versionId,
      timestamp: Date.now(),
      author,
      parentId: null,
      delta: null,
      snapshot: content,
      isSnapshot: true,
      description: 'Initial version'
    };

    this.store.versions.set(versionId, version);
    this.store.currentVersionId = versionId;
    return versionId;
  }

  // Save a new version
  saveVersion(content: string, author: string, description?: string): string {
    const parentVersion = this.store.versions.get(this.store.currentVersionId);
    if (!parentVersion) throw new Error('No parent version found');

    const parentContent = this.reconstructVersion(this.store.currentVersionId);
    const versionId = this.generateId();
    
    // Determine if this should be a snapshot
    const versionCount = this.getVersionsSinceLastSnapshot();
    const isSnapshot = versionCount >= this.store.snapshotInterval;

    const version: Version = {
      id: versionId,
      timestamp: Date.now(),
      author,
      parentId: this.store.currentVersionId,
      delta: isSnapshot ? null : DeltaEngine.diff(parentContent, content),
      snapshot: isSnapshot ? content : null,
      isSnapshot,
      description
    };

    this.store.versions.set(versionId, version);
    this.store.currentVersionId = versionId;
    return versionId;
  }

  // Reconstruct content at a specific version
  reconstructVersion(versionId: string): string {
    const path = this.getVersionPath(versionId);
    
    // Find the nearest snapshot in the path
    let snapshotIndex = path.length - 1;
    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i].isSnapshot) {
        snapshotIndex = i;
        break;
      }
    }

    const snapshot = path[snapshotIndex];
    let content = snapshot.snapshot!;

    // Apply deltas forward from snapshot
    // Apply deltas forward from snapshot
    for (let i = snapshotIndex + 1; i < path.length; i++) {
        const delta = path[i].delta;  // Extract to variable
        if (delta) {
            content = DeltaEngine.apply(content, delta);  // ✅ Works!
        }
    }

    return content;
  }

  // Get version chain from root to specified version
  private getVersionPath(versionId: string): Version[] {
    const path: Version[] = [];
    let currentId: string | null = versionId;

    while (currentId) {
      const version = this.store.versions.get(currentId);
      if (!version) break;
      path.unshift(version);
      currentId = version.parentId;
    }

    return path;
  }

  // Get all versions
  getAllVersions(): Version[] {
    return Array.from(this.store.versions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Restore to a previous version
  restoreVersion(versionId: string, author: string): string {
    const content = this.reconstructVersion(versionId);
    return this.saveVersion(content, author, `Restored to version ${versionId.slice(0, 8)}`);
  }

  private getVersionsSinceLastSnapshot(): number {
    let count = 0;
    let currentId = this.store.currentVersionId;

    while (currentId) {
      const version = this.store.versions.get(currentId);
      if (!version) break;
      if (version.isSnapshot) break;
      count++;
      currentId = version.parentId!;
    }

    return count;
  }

  private generateId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export store for persistence
  export(): string {
    return JSON.stringify({
      versions: Array.from(this.store.versions.entries()),
      currentVersionId: this.store.currentVersionId,
      snapshotInterval: this.store.snapshotInterval
    });
  }

  // Import store
  import(data: string): void {
    const parsed = JSON.parse(data);
    this.store.versions = new Map(parsed.versions);
    this.store.currentVersionId = parsed.currentVersionId;
    this.store.snapshotInterval = parsed.snapshotInterval;
  }
}