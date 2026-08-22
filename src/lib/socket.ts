import { io, type Socket } from 'socket.io-client';
import { api as apiHelpers } from '@/lib/api';

let socket: Socket | null = null;
let lastToken: string | null = null;

// Safe no-op socket stub for unauthenticated or connecting fallback states
class SafeDummySocket {
  connected = false;
  id = '';
  auth = {};
  io = {
    on: () => this,
    off: () => this,
  };

  on(_event: string, _fn: (...args: any[]) => void): this {
    return this;
  }
  once(_event: string, _fn: (...args: any[]) => void): this {
    return this;
  }
  off(_event?: string, _fn?: (...args: any[]) => void): this {
    return this;
  }
  emit(_event: string, ..._args: any[]): this {
    return this;
  }
  connect(): this {
    return this;
  }
  disconnect(): this {
    return this;
  }
  close(): this {
    return this;
  }
}

const dummySocket = new SafeDummySocket() as unknown as Socket;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  const tokens = apiHelpers.getStoredTokens();
  const token = tokens?.accessToken;
  if (!token) {
    if (socket) {
      try {
        socket.disconnect();
      } catch {
        // ignore
      }
      socket = null;
      lastToken = null;
    }
    return dummySocket;
  }

  if (socket && socket.connected && lastToken === token) return socket;

  // If socket exists but token changed, disconnect old socket first
  if (socket && lastToken !== token) {
    try {
      socket.disconnect();
    } catch {
      // ignore
    }
    socket = null;
  }

  const baseUrl = String(apiHelpers.API_BASE || '').replace(/\/+$/, '');

  const isAndroidWebView = (() => {
    try {
      const ua = navigator?.userAgent || '';
      return Boolean((window as any).Android) || /; wv\)/i.test(ua) || /Version\/[\d.]+.*Chrome\/[\d.]+/i.test(ua);
    } catch {
      return false;
    }
  })();

  const transports: any = isAndroidWebView ? ['websocket'] : ['websocket', 'polling'];

  try {
    socket = io(baseUrl || undefined, {
      transports,
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });

    lastToken = token;

    socket.io.on('reconnect_attempt', () => {
      try {
        const t = apiHelpers.getStoredTokens()?.accessToken;
        if (t) {
          socket!.auth = { token: t } as any;
          lastToken = t;
        }
      } catch {
        // ignore
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err?.message || err);
    });

    return socket;
  } catch (err) {
    console.warn('[Socket] Failed to initialize socket connection:', err);
    return dummySocket;
  }
}

export function disconnectSocket() {
  if (socket) {
    try {
      socket.disconnect();
    } catch {
      // ignore
    }
    socket = null;
    lastToken = null;
  }
}

