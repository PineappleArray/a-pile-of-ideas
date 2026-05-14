// Minimal globals for tests that reference WebSocket constants before mocking
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  };
}

// Provide a minimal console shim if tests expect it (already present normally)
if (typeof global.MessageEvent === 'undefined') {
  // jsdom usually provides MessageEvent; this is a fallback
  global.MessageEvent = class MessageEvent {
    constructor(type, init) {
      this.type = type;
      this.data = init && init.data;
    }
  };
}
