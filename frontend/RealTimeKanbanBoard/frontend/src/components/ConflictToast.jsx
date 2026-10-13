import React from 'react';
import { useBoardStore } from '../store/useBoardStore.js';
import { AlertCircle, X } from 'lucide-react';

export function ConflictToast() {
  const { conflictNotice, clearConflictNotice } = useBoardStore();

  if (!conflictNotice) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md bg-amber-500 text-white rounded-2xl p-4 shadow-xl flex items-start space-x-3 border border-amber-600 animate-in slide-in-from-bottom duration-200">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-100" />
      <div className="flex-1 text-xs">
        <h5 className="font-bold text-sm text-white mb-0.5">Concurrency Conflict</h5>
        <p className="text-amber-100 leading-relaxed">{conflictNotice}</p>
      </div>
      <button
        onClick={clearConflictNotice}
        className="p-1 hover:bg-amber-600 rounded-lg text-white/80 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
