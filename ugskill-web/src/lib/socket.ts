import { io, Socket } from 'socket.io-client';
import { tokenStore } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export type SocketNamespace = '/exam' | '/tracking' | '/interview' | '/gd' | '/leaderboard' | '/chat';

const sockets: Map<SocketNamespace, Socket> = new Map();

/**
 * Gets or initializes a socket connection for a specific namespace.
 * It does not auto-connect. You must call `.connect()` or use `connectSocket`.
 */
export const getSocket = (namespace: SocketNamespace): Socket => {
  if (!sockets.has(namespace)) {
    const socket = io(`${SOCKET_URL}${namespace}`, {
      autoConnect: false,
      auth: (cb) => {
        cb({ token: tokenStore.getAccessToken() });
      },
      transports: ['websocket', 'polling'], // Fallback to polling if wss fails
    });

    socket.on('connect_error', (err) => {
      console.warn(`[Socket.io] Connection error on ${namespace}:`, err.message);
    });

    sockets.set(namespace, socket);
  }
  
  return sockets.get(namespace)!;
};

/**
 * Gets and immediately connects the socket for the specified namespace.
 */
export const connectSocket = (namespace: SocketNamespace): Socket => {
  const socket = getSocket(namespace);
  if (socket.disconnected) {
    socket.connect();
  }
  return socket;
};

/**
 * Disconnects a specific socket namespace.
 */
export const disconnectSocket = (namespace: SocketNamespace): void => {
  const socket = sockets.get(namespace);
  if (socket?.connected) {
    socket.disconnect();
  }
};

/**
 * Disconnects all active socket namespaces.
 * Useful for logout flows.
 */
export const disconnectAllSockets = (): void => {
  sockets.forEach((socket) => {
    if (socket.connected) {
      socket.disconnect();
    }
  });
};
