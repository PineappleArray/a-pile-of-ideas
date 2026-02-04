// Real-world configuration (estimated from behavior)
const GOOGLE_DOCS_CONFIG = {
  snapshotInterval: 8,              // Snapshot every ~8 versions
  snapshotTimeThreshold: 20 * 60,   // Or every 20 minutes
  compressionEnabled: true,
  compressionAlgorithm: 'brotli',   // Better than gzip
  cacheSize: 50,                    // Keep 50 versions in memory
  indexStrategy: 'composite',       // Multiple indices
  binaryEncoding: true,
  deltaComposition: true,           // Compose deltas periodically
  
  // Measured metrics:
  avgDeltaSize: 150,                // bytes (after compression)
  avgSnapshotSize: 50000,           // bytes (50KB average doc)
  reconstructionTime: 5,            // ms (average)
  storagePerVersion: 200,           // bytes (amortized)
};