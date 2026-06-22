import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import systemNotificationService from '../services/systemNotificationService';
import { getWsBaseUrl } from '../config/runtime';

const WS_BASE_URL = getWsBaseUrl();

const SseContext = createContext(null);

export function SseProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  const wsRef = useRef(null);
  const listenersRef = useRef(new Set());
  const reconnectRef = useRef(null);

  const subscribe = useCallback((callback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  }, []);

  const resetCount = useCallback(() => setNewCount(0), []);
  const decrementCount = useCallback(() => setNewCount(prev => Math.max(0, prev - 1)), []);

  // Fetch initial unread count from API
  useEffect(() => {
    if (user?.role !== 'RESIDENT' || !user?.id) return;
    systemNotificationService.getUnreadCount(user.id)
      .then(res => {
        const count = res.data?.data ?? 0;
        setNewCount(count);
      })
      .catch(() => {});
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.role !== 'RESIDENT' || !user?.id) return;

    let shouldReconnect = true;

    const connectWS = () => {
      const url = `${WS_BASE_URL}/ws/notifications/${user.id}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLatestNotification(data);
          setNewCount((prev) => prev + 1);

          // Notify all subscribers
          listenersRef.current.forEach((cb) => cb(data));

          // Show toast
          toast.info(
            <div>
              <strong>🔔 Thông báo mới</strong>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>{data.title}</p>
            </div>,
            { autoClose: 5000 }
          );
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (shouldReconnect) {
          reconnectRef.current = setTimeout(connectWS, 5000);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      shouldReconnect = false;
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [user?.id, user?.role]);

  return (
    <SseContext.Provider value={{ connected, newCount, latestNotification, resetCount, decrementCount, subscribe }}>
      {children}
    </SseContext.Provider>
  );
}

export function useSse() {
  const context = useContext(SseContext);
  if (!context) {
    throw new Error('useSse must be used within SseProvider');
  }
  return context;
}
