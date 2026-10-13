import React from 'react';
import { useBoardStore } from '../store/useBoardStore.js';
import { Search, Filter, X } from 'lucide-react';

export function FilterBar({ members = [] }) {
  const { filters, setFilters, clearFilters } = useBoardStore();

  const activeFilterCount = [
    filters.priority,
    filters.assignee,
    filters.due,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ search: '' })}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Select Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ priority: e.target.value })}
          className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Priority: All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assignee}
          onChange={(e) => setFilters({ assignee: e.target.value })}
          className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Assignee: All</option>
          {members.map((m) => (
            <option key={m.user._id || m.user.id} value={m.user._id || m.user.id}>
              {m.user.name}
            </option>
          ))}
        </select>

        {/* Due Date Filter */}
        <select
          value={filters.due}
          onChange={(e) => setFilters({ due: e.target.value })}
          className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Due: All</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="upcoming">Upcoming</option>
        </select>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters ({activeFilterCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
