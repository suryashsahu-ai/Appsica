import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useBoardStore } from '../store/useBoardStore.js';
import { LayoutGrid, Shield, LogOut, Wifi, WifiOff } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { isConnected, onlineUsers, currentBoard } = useBoardStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl tracking-tight">
            <LayoutGrid className="w-6 h-6" />
            <span className="text-slate-900 font-extrabold">Kanban<span className="text-indigo-600">Flow</span></span>
          </Link>

          {/* Connection status indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border">
            {isConnected ? (
              <span className="flex items-center text-emerald-700 bg-emerald-50 border-emerald-200">
                <Wifi className="w-3.5 h-3.5 mr-1 text-emerald-500 animate-pulse" />
                Live Sync
              </span>
            ) : (
              <span className="flex items-center text-amber-700 bg-amber-50 border-amber-200">
                <WifiOff className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Offline
              </span>
            )}
          </div>
        </div>

        {/* Board Presence (if on active board) */}
        {currentBoard && onlineUsers.length > 0 && (
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Online now:</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {onlineUsers.map((u) => (
                <div
                  key={u.id}
                  title={`${u.name} (${u.email})`}
                  className="relative inline-flex items-center justify-center w-7 h-7 text-xs font-semibold text-white bg-indigo-500 border-2 border-white rounded-full shadow-sm"
                >
                  {u.name?.charAt(0).toUpperCase() || 'U'}
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full"></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User profile & actions */}
        <div className="flex items-center space-x-4">
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.role === 'admin' ? 'System Administrator' : user?.email}</div>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <button
              onClick={handleLogout}
              title="Log out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
