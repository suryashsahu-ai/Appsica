import { useEffect } from 'react';
import { getSocket, connectSocket } from '../socket/socket.js';
import { useBoardStore } from '../store/useBoardStore.js';

export function useSocket(boardId) {
  const {
    setIsConnected,
    onSocketTaskCreated,
    onSocketTaskUpdated,
    onSocketTaskMoved,
    onSocketTaskDeleted,
    onSocketPresenceUpdated,
    onSocketTaskTyping,
    onSocketBoardState,
    fetchBoardDetails,
  } = useBoardStore();

  useEffect(() => {
    if (!boardId) return;

    const socket = connectSocket();

    const handleConnect = () => {
      setIsConnected(true);
      // Join board room on connect / reconnect
      socket.emit('board:join', { boardId }, (res) => {
        if (res?.success) {
          onSocketPresenceUpdated({ onlineUsers: res.onlineUsers });
        }
      });
      // Re-fetch canonical state on reconnect to catch missed events
      fetchBoardDetails(boardId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('board:state', onSocketBoardState);
    socket.on('task:created', onSocketTaskCreated);
    socket.on('task:updated', onSocketTaskUpdated);
    socket.on('task:moved', onSocketTaskMoved);
    socket.on('task:deleted', onSocketTaskDeleted);
    socket.on('presence:updated', onSocketPresenceUpdated);
    socket.on('task:typing', onSocketTaskTyping);

    return () => {
      socket.emit('board:leave', { boardId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('board:state', onSocketBoardState);
      socket.off('task:created', onSocketTaskCreated);
      socket.off('task:updated', onSocketTaskUpdated);
      socket.off('task:moved', onSocketTaskMoved);
      socket.off('task:deleted', onSocketTaskDeleted);
      socket.off('presence:updated', onSocketPresenceUpdated);
      socket.off('task:typing', onSocketTaskTyping);
    };
  }, [boardId]);
}
