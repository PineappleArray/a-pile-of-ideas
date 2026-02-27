import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketMessage = 
  | { type: 'delta'; delta: any; version: number; author: string }
  | { type: 'init'; content: Record<string, any>; version: number; users: any[] }
  | { type: 'user-joined'; userId: string }
  | { type: 'user-left'; userId: string }
  | { type: 'error'; error: string }
  | { type: 'cursor'; userId: string; cursor: { x: number; y: number } }
  | { type: 'move'; userId: string; x: number; y: number }
  | { type: 'resize'; userId: string; width: number; height: number }
  | { type: string; [key: string]: any };


export type UseWebSocketOptions = {
  onMessage?: (msg: WebSocketMessage) => void;
  reconnect?: boolean;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
};

export const useWebSocket = (initialUrl: string, options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    reconnect = true,
    reconnectDelayMs = 2000,
    maxReconnectAttempts = 5,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUrl, setActiveUrl] = useState(initialUrl);

  const connectToUrl = useCallback((url: string) => {
    //clear any pending reconnect
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    // close existing connection
    if (ws.current) {
      ws.current.close();
    }

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        setIsConnected(true);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        if (reconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          console.log(`Reconnecting... attempt ${reconnectAttempts.current}`);
          reconnectTimeout.current = setTimeout(() => connectToUrl(url), reconnectDelayMs);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.current.onmessage = (event) => {
        try {
          const parsed: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(parsed);
        } catch {
          console.error('Failed to parse WebSocket message:', event.data);
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
    }
  }, [onMessage, reconnect, reconnectDelayMs, maxReconnectAttempts]);

  //connect on mount / when url changes
  useEffect(() => {
    connectToUrl(activeUrl);

    return () => {
      reconnectAttempts.current = maxReconnectAttempts; //prevent reconnect on unmount
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [activeUrl]);

  const send = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const connect = useCallback((newUrl: string) => {
    reconnectAttempts.current = 0;
    setActiveUrl(newUrl); //triggers useEffect
  }, []);

  const disconnect = useCallback(() => {
    reconnectAttempts.current = maxReconnectAttempts; //prevent auto-reconnect
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (ws.current) ws.current.close();
  }, [maxReconnectAttempts]);

  return { send, connect, disconnect, isConnected };
};

//infer the type from the hook itself
export type WebSocketClient = ReturnType<typeof useWebSocket>; 