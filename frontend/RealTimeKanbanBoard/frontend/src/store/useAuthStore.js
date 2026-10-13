import { create } from 'zustand';
import { authService } from '../services/authService.js';
import { connectSocket, disconnectSocket } from '../socket/socket.js';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  checkAuth: async () => {
    set({ loading: true, error: null });
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, loading: false });
      connectSocket();
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
      disconnectSocket();
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(email, password);
      set({ user: data.user, isAuthenticated: true, loading: false });
      connectSocket();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check credentials.';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  adminLogin: async (adminId, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.adminLogin(adminId, password);
      set({ user: data.user, isAuthenticated: true, loading: false });
      connectSocket();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Administrator authentication failed.';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.register(name, email, password);
      set({ user: data.user, isAuthenticated: true, loading: false });
      connectSocket();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed.';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      disconnectSocket();
      set({ user: null, isAuthenticated: false, loading: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
