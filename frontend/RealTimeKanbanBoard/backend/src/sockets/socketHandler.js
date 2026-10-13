import { Server } from 'socket.io';
import { verifyToken, COOKIE_NAME } from '../utils/token.js';
import { Board } from '../models/Board.js';
import { User } from '../models/User.js';

// Map: boardId -> Map<userId, { user: { id, name, email }, socketIds: Set<string> }>
const boardPresence = new Map();

// Map: socketId -> Set<boardId>
const socketRooms = new Map();

// Map: socketId -> Map<taskId, Timeout>
const typingTimeouts = new Map();

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export function initSocketIO(server, clientOrigin) {
  const io = new Server(server, {
    cors: {
      origin: clientOrigin || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.cookie) {
        token = parseCookie(socket.handshake.headers.cookie, COOKIE_NAME);
      }

      if (!token) {
        return next(new Error('Authentication error: No session token provided.'));
      }

      const decoded = verifyToken(token);

      if (decoded.tokenType === 'admin') {
        socket.user = {
          id: 'admin',
          name: 'System Administrator',
          email: 'admin@system.local',
          role: 'admin',
          tokenType: 'admin',
        };
        return next();
      }

      const user = await User.findById(decoded.userId).select('name email role isActive');
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User inactive or not found.'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: 'user',
        tokenType: 'user',
      };

      next();
    } catch (err) {
      return next(new Error('Authentication error: ' + (err.message || 'Invalid token.')));
    }
  });

  io.on('connection', (socket) => {
    socketRooms.set(socket.id, new Set());
    typingTimeouts.set(socket.id, new Map());

    /**
     * Authenticated board room join
     */
    socket.on('board:join', async (data, callback) => {
      const boardId = typeof data === 'string' ? data : data?.boardId;
      if (!boardId) {
        return callback?.({ success: false, error: 'boardId is required.' });
      }

      try {
        const board = await Board.findById(boardId);
        if (!board) {
          return callback?.({ success: false, error: 'Board not found.' });
        }

        // Verify membership (or reject admin token)
        if (socket.user.tokenType === 'admin') {
          return callback?.({ success: false, error: 'Admin cannot join private board rooms.' });
        }

        const isMember = board.members.some((m) => m.user.toString() === socket.user.id);
        if (!isMember) {
          return callback?.({ success: false, error: 'Forbidden: You are not a member of this board.' });
        }

        const roomName = `board_${boardId}`;
        socket.join(roomName);
        socketRooms.get(socket.id).add(boardId);

        // Update Presence
        if (!boardPresence.has(boardId)) {
          boardPresence.set(boardId, new Map());
        }
        const bPres = boardPresence.get(boardId);

        if (!bPres.has(socket.user.id)) {
          bPres.set(socket.user.id, {
            user: { id: socket.user.id, name: socket.user.name, email: socket.user.email },
            socketIds: new Set([socket.id]),
          });
        } else {
          bPres.get(socket.user.id).socketIds.add(socket.id);
        }

        // Broadcast presence update
        const onlineUsers = Array.from(bPres.values()).map((p) => p.user);
        io.to(roomName).emit('presence:updated', { boardId, onlineUsers });

        callback?.({ success: true, boardId, onlineUsers });
      } catch (err) {
        callback?.({ success: false, error: err.message });
      }
    });

    /**
     * Board leave
     */
    socket.on('board:leave', (data, callback) => {
      const boardId = typeof data === 'string' ? data : data?.boardId;
      if (!boardId) return callback?.({ success: false });

      handleBoardLeave(socket, boardId);
      callback?.({ success: true });
    });

    /**
     * Typing indicators
     */
    socket.on('task:typing:start', ({ boardId, taskId }) => {
      if (!boardId || !taskId) return;
      const roomName = `board_${boardId}`;

      // Notify others in board room
      socket.to(roomName).emit('task:typing', {
        boardId,
        taskId,
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping: true,
      });

      // Auto-expire typing after 5 seconds of inactivity
      const timeouts = typingTimeouts.get(socket.id);
      if (timeouts.has(taskId)) {
        clearTimeout(timeouts.get(taskId));
      }
      timeouts.set(
        taskId,
        setTimeout(() => {
          socket.to(roomName).emit('task:typing', {
            boardId,
            taskId,
            userId: socket.user.id,
            userName: socket.user.name,
            isTyping: false,
          });
          timeouts.delete(taskId);
        }, 5000)
      );
    });

    socket.on('task:typing:stop', ({ boardId, taskId }) => {
      if (!boardId || !taskId) return;
      const roomName = `board_${boardId}`;

      const timeouts = typingTimeouts.get(socket.id);
      if (timeouts.has(taskId)) {
        clearTimeout(timeouts.get(taskId));
        timeouts.delete(taskId);
      }

      socket.to(roomName).emit('task:typing', {
        boardId,
        taskId,
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping: false,
      });
    });

    /**
     * Disconnection handling
     */
    socket.on('disconnect', () => {
      // Clear typing timeouts
      const timeouts = typingTimeouts.get(socket.id);
      if (timeouts) {
        timeouts.forEach((timer) => clearTimeout(timer));
        typingTimeouts.delete(socket.id);
      }

      // Cleanup presence across all joined rooms
      const joinedBoards = socketRooms.get(socket.id) || new Set();
      joinedBoards.forEach((boardId) => {
        handleBoardLeave(socket, boardId);
      });
      socketRooms.delete(socket.id);
    });
  });

  function handleBoardLeave(socket, boardId) {
    const roomName = `board_${boardId}`;
    socket.leave(roomName);

    const bPres = boardPresence.get(boardId);
    if (bPres && bPres.has(socket.user.id)) {
      const entry = bPres.get(socket.user.id);
      entry.socketIds.delete(socket.id);

      // If no active connections left for user, remove from presence
      if (entry.socketIds.size === 0) {
        bPres.delete(socket.user.id);
      }

      if (bPres.size === 0) {
        boardPresence.delete(boardId);
      }

      const remainingOnline = bPres ? Array.from(bPres.values()).map((p) => p.user) : [];
      io.to(roomName).emit('presence:updated', { boardId, onlineUsers: remainingOnline });
    }
  }

  // Socket emitter function to be injected into Express app
  const emitSocketEvent = (boardId, event, data) => {
    io.to(`board_${boardId}`).emit(event, data);
  };

  return { io, emitSocketEvent };
}
