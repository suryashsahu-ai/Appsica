import React, { useState, useEffect } from 'react';
import { boardService } from '../services/boardService.js';
import { X, Activity as ActivityIcon, Clock, User } from 'lucide-react';

const ACTION_LABELS = {
  TASK_CREATED: { label: 'Created Task', color: 'bg-emerald-100 text-emerald-800' },
  TASK_UPDATED: { label: 'Updated Task', color: 'bg-blue-100 text-blue-800' },
  TASK_MOVED: { label: 'Moved Task', color: 'bg-indigo-100 text-indigo-800' },
  TASK_REORDERED: { label: 'Reordered Task', color: 'bg-purple-100 text-purple-800' },
  TASK_DELETED: { label: 'Deleted Task', color: 'bg-rose-100 text-rose-800' },
  MEMBER_INVITED: { label: 'Invited Member', color: 'bg-amber-100 text-amber-800' },
  MEMBER_REMOVED: { label: 'Removed Member', color: 'bg-slate-100 text-slate-800' },
  COMMENT_ADDED: { label: 'Added Comment', color: 'bg-teal-100 text-teal-800' },
  BOARD_UPDATED: { label: 'Updated Board', color: 'bg-sky-100 text-sky-800' },
};

export function ActivityDrawer({ boardId, isOpen, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && boardId) {
      loadActivities();
    }
  }, [isOpen, boardId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await boardService.getBoardActivity(boardId, 1);
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load board activity', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ActivityIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Board Activity Feed</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="text-center text-xs text-slate-400 py-8">Loading activity timeline...</div>
          ) : activities.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-8">No activity recorded yet.</div>
          ) : (
            activities.map((act) => {
              const meta = ACTION_LABELS[act.actionType] || {
                label: act.actionType,
                color: 'bg-slate-100 text-slate-800',
              };

              return (
                <div key={act._id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{act.actor?.name || 'User'}</span>
                  </div>

                  {act.metadata && (
                    <div className="text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                      {act.metadata.title && <div>Task: <strong>{act.metadata.title}</strong></div>}
                      {act.metadata.fromStatus && act.metadata.toStatus && (
                        <div>Moved from <em>{act.metadata.fromStatus}</em> → <em>{act.metadata.toStatus}</em></div>
                      )}
                      {act.metadata.invitedUser && <div>Invited: <strong>{act.metadata.invitedUser}</strong></div>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
