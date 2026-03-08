import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
//  Feature 1: SignalR Context – real-time connection
// ═══════════════════════════════════════════════════════════════════════════════
interface SignalRContextType {
  isConnected: boolean;
  onEvent: (event: string, callback: (...args: unknown[]) => void) => () => void;
}

const SignalRContext = createContext<SignalRContextType>({
  isConnected: false,
  onEvent: () => () => {}
});

export const SignalRProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<import('@microsoft/signalr').HubConnection | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());

  useEffect(() => {
    const connect = async () => {
      try {
        // Dynamic import so SignalR only loads when user is authenticated
        const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');

        const conn = new HubConnectionBuilder()
          .withUrl('https://localhost:7096/hubs/notifications', {
            withCredentials: true // 🔥 THIS IS THE FIX
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000])
          .configureLogging(LogLevel.Warning)
          .build();

        // Forward all events to registered listeners
        conn.onreconnected(() => setIsConnected(true));
        conn.onclose(() => setIsConnected(false));

        // Generic event forwarder using a proxy approach
        const rawOn = conn.on.bind(conn);
        const eventProxy = new Proxy({}, {
          get: (_, event: string) => (...args: unknown[]) => {
            const listeners = listenersRef.current.get(event);
            listeners?.forEach(cb => cb(...args));
          }
        });

        // Register common events
        ['ReceiveNotification', 'UserOnline', 'UserOffline', 'PresenceUpdated',
          'UserActivity', 'LeaveApplied','NewAnnouncement'].forEach(event => {
          rawOn(event, (...args) => {
            const listeners = listenersRef.current.get(event);
            listeners?.forEach(cb => cb(...args));
          });
        });

        await conn.start();
        connectionRef.current = conn;
        setIsConnected(true);
      } catch (err) {
        console.warn('SignalR connection failed (offline?)', err);
      }
    };

    connect();

    return () => { connectionRef.current?.stop(); };
  }, []);

  const onEvent = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (!listenersRef.current.has(event))
      listenersRef.current.set(event, new Set());

    listenersRef.current.get(event)!.add(callback);

    return () => { listenersRef.current.get(event)?.delete(callback); };
  }, []);

  return (
    <SignalRContext.Provider value={{ isConnected, onEvent }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => useContext(SignalRContext);