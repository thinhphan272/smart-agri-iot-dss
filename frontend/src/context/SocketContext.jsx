import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  const connectToSession = (newSessionId) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setSessionId(newSessionId);
    const wsUrl = `ws://localhost:8000/ws/live-sync/${newSessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`[WebSocket] Connected to session ${newSessionId}`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        setLastMessage({ type: 'RAW', payload: event.data });
      }
    };

    ws.onerror = (err) => {
      console.warn('[WebSocket] Connection error:', err);
    };

    ws.onclose = () => {
      console.log('[WebSocket] Connection closed');
      setIsConnected(false);
    };

    socketRef.current = ws;
  };

  const sendMessage = (msgObj) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgObj));
    } else {
      console.warn('[WebSocket] Cannot send message: socket not open');
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setSessionId(null);
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        sessionId,
        isConnected,
        lastMessage,
        connectToSession,
        sendMessage,
        disconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
