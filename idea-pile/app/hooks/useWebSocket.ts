import { useEffect, useRef, useState } from 'react';

export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export interface IWebSocketClient {
  send: (message: WebSocketMessage) => void;
  connect: (url: string) => void;
  disconnect: () => void;
  isConnected: boolean;
}

export const useWebSocket = (url: string): IWebSocketClient & { isConnected: boolean } => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connect = () => {
      try {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        ws.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

        ws.current.onmessage = (event) => {
          console.log('Message from server:', event.data);
        };
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      const WS_OPEN = (global as any).WebSocket?.OPEN ?? 1;
      if (ws.current && ws.current.readyState === WS_OPEN) {
        ws.current.close();
      }
    };
  }, [url]);

  const send = (message: WebSocketMessage) => {
    const WS_OPEN = (global as any).WebSocket?.OPEN ?? 1;
    if (ws.current && ws.current.readyState === WS_OPEN) {
      ws.current.send(JSON.stringify(message));
      console.log('Sent message:', message);
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const connect = (newUrl: string) => {
    if (ws.current) {
      ws.current.close();
    }
    // Re-create connection - will use the useEffect
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  return {
    send,
    connect,
    disconnect,
    isConnected,
  };
};
