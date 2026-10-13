import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove trailing /api to connect to root socket namespace
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');
    const token = localStorage.getItem('kanban_token');

    socket = io(socketUrl, {
      withCredentials: true,
      auth: { token },
      autoConnect: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  const token = localStorage.getItem('kanban_token');
  if (s && !s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
