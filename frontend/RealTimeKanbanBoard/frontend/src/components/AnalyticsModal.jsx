import React, { useState, useEffect } from 'react';
import { boardService } from '../services/boardService.js';
import { X, BarChart3, CheckCircle2, AlertTriangle, ListTodo } from 'lucide-react';

export function AnalyticsModal({ boardId, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (boardId) {
      loadAnalytics();
    }
  }, [boardId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await boardService.getBoardAnalytics(boardId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    analytics && analytics.totalTasks > 0
      ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-lg">Board Analytics</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Computing analytics...</div>
        ) : !analytics ? (
          <div className="py-12 text-center text-xs text-slate-400">Unable to load metrics.</div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <ListTodo className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
                <div className="text-xl font-extrabold text-slate-900">{analytics.totalTasks}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Tasks</div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                <div className="text-xl font-extrabold text-emerald-700">{analytics.completedTasks}</div>
                <div className="text-[10px] text-emerald-700 font-semibold uppercase">{completionRate}% Done</div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <AlertTriangle className="w-4 h-4 mx-auto text-rose-600 mb-1" />
                <div className="text-xl font-extrabold text-rose-700">{analytics.overdueTasks}</div>
                <div className="text-[10px] text-rose-700 font-semibold uppercase">Overdue</div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Status Distribution
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(analytics.countsByStatus).map(([status, count]) => {
                  const pct = analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-slate-600 font-medium mb-1">
                        <span>{status}</span>
                        <span>{count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Priority Distribution
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs text-center font-medium">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-emerald-600 font-bold text-base">{analytics.countsByPriority.Low}</div>
                  <div className="text-[10px] text-slate-500">Low Priority</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-amber-600 font-bold text-base">{analytics.countsByPriority.Medium}</div>
                  <div className="text-[10px] text-slate-500">Medium Priority</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-rose-600 font-bold text-base">{analytics.countsByPriority.High}</div>
                  <div className="text-[10px] text-slate-500">High Priority</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
