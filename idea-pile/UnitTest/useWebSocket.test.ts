import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../app/hooks/useWebSocket';

// Mock WebSocket
class MockWebSocket {
  readyState: number = 0; // CONNECTING
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  sentMessages: string[] = [];

  constructor(public url: string) {
    // Simulate connection after a tick
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen();
      }
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== 1) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose();
    }
  }

  // Helper method for tests to simulate receiving a message
  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

// Store reference to mock
let mockWebSocketInstance: MockWebSocket | null = null;

// Mock global WebSocket
(global as any).WebSocket = jest.fn((url: string) => {
  mockWebSocketInstance = new MockWebSocket(url);
  return mockWebSocketInstance;
});

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocketInstance = null;
  });

  test('initializes WebSocket connection with correct URL', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080');
  });

  test('sets isConnected to false initially', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));
    expect(result.current.isConnected).toBe(false);
  });

  test('sets isConnected to true when connection opens', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  test('sends JSON message when socket is open', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const message = {
      type: 'create-sticky-note',
      documentId: 'doc-1',
      id: 'box-123',
      x: 100,
      y: 200,
    };

    act(() => {
      result.current.send(message);
    });

    expect(mockWebSocketInstance?.sentMessages.length).toBe(1);
    expect(JSON.parse(mockWebSocketInstance!.sentMessages[0])).toEqual(message);
  });

  test('does not send when socket is not connected', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    // Send before connection opens
    const message = { type: 'test', data: 'value' };

    act(() => {
      result.current.send(message);
    });

    // Should not have sent yet
    expect(mockWebSocketInstance?.sentMessages.length).toBe(0);
  });

  test('closes connection on unmount', async () => {
    const { unmount } = renderHook(() => useWebSocket('ws://localhost:8080'));

    await waitFor(() => {
      expect(mockWebSocketInstance?.readyState).toBe(1); // OPEN
    });

    unmount();

    expect(mockWebSocketInstance?.readyState).toBe(3); // CLOSED
  });

  test('handles connection error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    // Simulate error
    act(() => {
      if (mockWebSocketInstance?.onerror) {
        mockWebSocketInstance.onerror(new Event('error'));
      }
    });

    expect(result.current.isConnected).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  test('sets isConnected to false when disconnected', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      mockWebSocketInstance?.close();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  test('sends multiple messages in sequence', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const messages = [
      { type: 'create-sticky-note', id: 'box-1' },
      { type: 'update-sticky-note', id: 'box-1', content: 'text' },
      { type: 'delete-sticky-note', id: 'box-1' },
    ];

    act(() => {
      messages.forEach((msg) => result.current.send(msg));
    });

    expect(mockWebSocketInstance?.sentMessages.length).toBe(3);
    expect(JSON.parse(mockWebSocketInstance!.sentMessages[0])).toEqual(messages[0]);
    expect(JSON.parse(mockWebSocketInstance!.sentMessages[1])).toEqual(messages[1]);
    expect(JSON.parse(mockWebSocketInstance!.sentMessages[2])).toEqual(messages[2]);
  });
});
