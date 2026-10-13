import { create } from 'zustand';
import { boardService } from '../services/boardService.js';

export const useBoardStore = create((set, get) => ({
  boards: [],
  currentBoard: null,
  tasks: [],
  onlineUsers: [],
  typingUsers: {}, // { taskId: userName }
  filters: {
    priority: '',
    assignee: '',
    due: '',
    search: '',
  },
  conflictNotice: null,
  isConnected: false,
  loading: false,
  error: null,

  setIsConnected: (connected) => set({ isConnected: connected }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () =>
    set({
      filters: { priority: '', assignee: '', due: '', search: '' },
    }),

  clearConflictNotice: () => set({ conflictNotice: null }),

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const boards = await boardService.getBoards();
      set({ boards, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to load boards.', loading: false });
    }
  },

  createBoard: async (title, description) => {
    try {
      const board = await boardService.createBoard(title, description);
      set((state) => ({ boards: [board, ...state.boards] }));
      return { success: true, board };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to create board.' };
    }
  },

  fetchBoardDetails: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const data = await boardService.getBoardById(boardId);
      set({
        currentBoard: data.board,
        tasks: data.tasks,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Failed to load board details.',
        loading: false,
      });
    }
  },

  /**
   * Optimistic Move Task with OCC and automatic rollback / reconcile on 409 Conflict
   */
  moveTask: async (taskId, destinationStatus, destinationPosition) => {
    const state = get();
    const board = state.currentBoard;
    if (!board) return;

    const previousTasks = [...state.tasks];
    const taskToMove = previousTasks.find((t) => t._id === taskId);
    if (!taskToMove) return;

    const expectedRevision = board.revision;

    // Apply optimistic update locally
    const updatedTasks = previousTasks.map((t) => {
      if (t._id === taskId) {
        return { ...t, status: destinationStatus, position: destinationPosition };
      }
      return t;
    });

    set({ tasks: updatedTasks });

    try {
      const result = await boardService.moveTask(taskId, {
        destinationStatus,
        destinationPosition,
        expectedBoardRevision: expectedRevision,
      });

      // Update confirmed revision and canonical task
      set((s) => ({
        currentBoard: s.currentBoard
          ? { ...s.currentBoard, revision: result.boardRevision }
          : s.currentBoard,
        tasks: s.tasks.map((t) => (t._id === taskId ? result.task : t)),
      }));
    } catch (err) {
      if (err.response?.status === 409) {
        // Rollback to previous state and notify user
        set({
          tasks: previousTasks,
          conflictNotice: 'Conflict: Another collaborator moved a task first. Board state refreshed.',
        });
        // Re-fetch canonical state to synchronize
        get().fetchBoardDetails(board._id);
      } else {
        // Revert on standard API error
        set({
          tasks: previousTasks,
          error: err.response?.data?.error || 'Failed to move task.',
        });
      }
    }
  },

  createTask: async (taskData) => {
    const { currentBoard } = get();
    if (!currentBoard) return;
    try {
      const result = await boardService.createTask(currentBoard._id, taskData);
      set((state) => ({
        tasks: [...state.tasks, result.task],
        currentBoard: { ...state.currentBoard, revision: result.boardRevision },
      }));
      return { success: true, task: result.task };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to create task.' };
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const result = await boardService.updateTask(taskId, taskData);
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === taskId ? result.task : t)),
        currentBoard: state.currentBoard
          ? { ...state.currentBoard, revision: result.boardRevision }
          : state.currentBoard,
      }));
      return { success: true, task: result.task };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update task.' };
    }
  },

  deleteTask: async (taskId) => {
    try {
      const result = await boardService.deleteTask(taskId);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
        currentBoard: state.currentBoard
          ? { ...state.currentBoard, revision: result.boardRevision }
          : state.currentBoard,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to delete task.' };
    }
  },

  // Real-time socket event reconciliations
  onSocketTaskCreated: ({ task, boardRevision }) => {
    set((state) => {
      if (state.tasks.some((t) => t._id === task._id)) return state;
      return {
        tasks: [...state.tasks, task],
        currentBoard: state.currentBoard
          ? { ...state.currentBoard, revision: boardRevision }
          : state.currentBoard,
      };
    });
  },

  onSocketTaskUpdated: ({ task, boardRevision }) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === task._id ? task : t)),
      currentBoard: state.currentBoard
        ? { ...state.currentBoard, revision: boardRevision }
        : state.currentBoard,
    }));
  },

  onSocketTaskMoved: ({ task, boardRevision }) => {
    set((state) => {
      // Avoid overwriting newer revision if already applied
      const updated = state.tasks.map((t) => (t._id === task._id ? task : t));
      return {
        tasks: updated,
        currentBoard: state.currentBoard
          ? { ...state.currentBoard, revision: boardRevision }
          : state.currentBoard,
      };
    });
  },

  onSocketTaskDeleted: ({ taskId, boardRevision }) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== taskId),
      currentBoard: state.currentBoard
        ? { ...state.currentBoard, revision: boardRevision }
        : state.currentBoard,
    }));
  },

  onSocketPresenceUpdated: ({ onlineUsers }) => {
    set({ onlineUsers });
  },

  onSocketTaskTyping: ({ taskId, userName, isTyping }) => {
    set((state) => {
      const typingUsers = { ...state.typingUsers };
      if (isTyping) {
        typingUsers[taskId] = userName;
      } else {
        delete typingUsers[taskId];
      }
      return { typingUsers };
    });
  },

  onSocketBoardState: ({ board }) => {
    set({ currentBoard: board });
  },
}));
