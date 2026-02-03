const CONFIGS = {
  // Real-time collaboration (Google Docs)
  collaboration: {
    snapshotInterval: 8,
    snapshotTimeThreshold: 1200,  // 20 min
    cacheSize: 50,
    compression: 'brotli',
    priority: 'speed'
  },
  
  // Long-term archival (GitHub)
  archival: {
    snapshotInterval: 50,
    snapshotTimeThreshold: Infinity,
    cacheSize: 10,
    compression: 'xz',  // Maximum compression
    priority: 'space'
  },
  
  // Local editing (VS Code)
  local: {
    snapshotInterval: 5,
    snapshotTimeThreshold: 300,  // 5 min
    cacheSize: 100,
    compression: 'none',  // Fast, storage is local
    priority: 'speed'
  }
};