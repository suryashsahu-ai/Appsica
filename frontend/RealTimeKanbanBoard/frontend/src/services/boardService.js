import { api } from '../utils/api.js';

export const boardService = {
  async getBoards() {
    const res = await api.get('/boards');
    return res.data.boards;
  },

  async createBoard(title, description) {
    const res = await api.post('/boards', { title, description });
    return res.data.board;
  },

  async getBoardById(boardId) {
    const res = await api.get(`/boards/${boardId}`);
    return res.data;
  },

  async updateBoard(boardId, data) {
    const res = await api.patch(`/boards/${boardId}`, data);
    return res.data.board;
  },

  async inviteMember(boardId, email, role) {
    const res = await api.post(`/boards/${boardId}/members`, { email, role });
    return res.data.board;
  },

  async removeMember(boardId, userId) {
    const res = await api.delete(`/boards/${boardId}/members/${userId}`);
    return res.data.board;
  },

  async getBoardTasks(boardId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assignee) params.append('assignee', filters.assignee);
    if (filters.status) params.append('status', filters.status);
    if (filters.due) params.append('due', filters.due);

    const res = await api.get(`/boards/${boardId}/tasks?${params.toString()}`);
    return res.data.tasks;
  },

  async createTask(boardId, taskData) {
    const res = await api.post(`/boards/${boardId}/tasks`, taskData);
    return res.data;
  },

  async updateTask(taskId, taskData) {
    const res = await api.patch(`/tasks/${taskId}`, taskData);
    return res.data;
  },

  async moveTask(taskId, { destinationStatus, destinationPosition, expectedBoardRevision }) {
    const res = await api.patch(`/tasks/${taskId}/move`, {
      destinationStatus,
      destinationPosition,
      expectedBoardRevision,
    });
    return res.data;
  },

  async deleteTask(taskId) {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
  },

  async getTaskComments(taskId) {
    const res = await api.get(`/tasks/${taskId}/comments`);
    return res.data.comments;
  },

  async createComment(taskId, content) {
    const res = await api.post(`/tasks/${taskId}/comments`, { content });
    return res.data.comment;
  },

  async deleteComment(commentId) {
    const res = await api.delete(`/comments/${commentId}`);
    return res.data;
  },

  async getBoardActivity(boardId, page = 1) {
    const res = await api.get(`/boards/${boardId}/activity?page=${page}`);
    return res.data;
  },

  async getBoardAnalytics(boardId) {
    const res = await api.get(`/boards/${boardId}/analytics`);
    return res.data.analytics;
  },

  // Admin features
  async getAdminStats() {
    const res = await api.get('/admin/system-stats');
    return res.data.stats;
  },

  async getAdminUsers() {
    const res = await api.get('/admin/users');
    return res.data.users;
  },

  async toggleUserStatus(userId, isActive) {
    const res = await api.patch(`/admin/users/${userId}/status`, { isActive });
    return res.data.user;
  },
};
