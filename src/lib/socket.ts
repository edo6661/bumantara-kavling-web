import { io, type Socket } from 'socket.io-client';
import { storage } from '../utils/storage';

let socket: Socket | null = null;
let globalHandlersAttached = false;

const getBackendUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

const isAuthError = (message: string): boolean =>
  message.startsWith('Unauthorized');

const attachGlobalHandlers = (instance: Socket): void => {
  if (globalHandlersAttached) return;
  globalHandlersAttached = true;

  instance.on('connect_error', (err: Error) => {
    if (import.meta.env.DEV) {
      console.warn('[Socket] connect_error:', err.message);
    }

    // Token invalid/expired — hentikan retry, biarkan axios 401 handler atau user login ulang
    if (isAuthError(err.message)) {
      instance.disconnect();
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
  });

  instance.on('disconnect', (reason) => {
    if (import.meta.env.DEV) {
      console.info('[Socket] disconnected:', reason);
    }

    // Server memutus paksa (mis. token expired saat reconnect) — coba sekali dengan token terbaru
    if (reason === 'io server disconnect') {
      const token = storage.getToken();
      if (token) {
        instance.auth = { token };
        instance.connect();
      }
    }
  });

  instance.io.on('reconnect', (attempt) => {
    if (import.meta.env.DEV) {
      console.info(`[Socket] reconnected (attempt ${attempt})`);
    }
  });

  instance.io.on('reconnect_error', (err: Error) => {
    if (import.meta.env.DEV) {
      console.warn('[Socket] reconnect_error:', err.message);
    }
  });

  instance.io.on('reconnect_failed', () => {
    console.warn(
      '[Socket] reconnect_failed — notifikasi real-time nonaktif, fallback ke polling API',
    );
  });
};

/**
 * Singleton Socket.IO client dengan JWT auth di handshake.
 * Room di-assign server-side setelah koneksi terautentikasi.
 */
export const getSocket = (): Socket | null => {
  const token = storage.getToken();
  if (!token) return null;

  const backendUrl = getBackendUrl();

  if (!socket) {
    socket = io(backendUrl, {
      auth: { token },
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });
    attachGlobalHandlers(socket);
  } else {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
};

export const refreshSocketAuth = (): void => {
  const token = storage.getToken();
  if (!socket || !token) return;
  socket.auth = { token };
  if (socket.connected) {
    socket.disconnect().connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.io.removeAllListeners();
    socket.disconnect();
    socket = null;
    globalHandlersAttached = false;
  }
};

export const isSocketConnected = (): boolean => socket?.connected ?? false;
