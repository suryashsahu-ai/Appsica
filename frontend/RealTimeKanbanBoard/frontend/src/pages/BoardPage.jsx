import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import { Navbar } from '../components/Navbar.jsx';
import { Column } from '../components/Column.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { TaskModal } from '../components/TaskModal.jsx';
import { ActivityDrawer } from '../components/ActivityDrawer.jsx';
import { AnalyticsModal } from '../components/AnalyticsModal.jsx';
import { InviteMemberModal } from '../components/InviteMemberModal.jsx';
import { ConflictToast } from '../components/ConflictToast.jsx';
import { useBoardStore } from '../store/useBoardStore.js';
import { useSocket } from '../hooks/useSocket.js';
import {
  Users,
  UserPlus,
  Activity,
  BarChart2,
  Plus,
  ArrowLeft,
  Layers,
} from 'lucide-react';

const COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'];

export function BoardPage() {
  const { boardId } = useParams();
  const {
    currentBoard,
    tasks,
    filters,
    loading,
    error,
    fetchBoardDetails,
    moveTask,
  } = useBoardStore();

  // Attach socket real-time events and room presence for this board
  useSocket(boardId);

  const [activeTaskModal, setActiveTaskModal] = useState(null); // { mode: 'create'|'edit', task?, defaultStatus? }
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchBoardDetails(boardId);
    }
  }, [boardId]);

  // Handle Drag & Drop move
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveTask(draggableId, destination.droppableId, destination.index);
  };

  // Filter tasks combinably
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Assignee filter
      if (filters.assignee) {
        const assigneeId = task.assignee?._id || task.assignee;
        if (assigneeId !== filters.assignee) return false;
      }

      // Due date filter
      if (filters.due) {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (filters.due === 'overdue') {
          if (taskDate >= startOfDay || task.status === 'Done') return false;
        } else if (filters.due === 'today') {
          if (taskDate < startOfDay || taskDate > endOfDay) return false;
        } else if (filters.due === 'upcoming') {
          if (taskDate <= endOfDay) return false;
        }
      }

      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(q);
        const descMatch = task.description?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Group filtered tasks by column status
  const tasksByColumn = useMemo(() => {
    const map = {
      Todo: [],
      'In Progress': [],
      Review: [],
      Done: [],
    };
    filteredTasks.forEach((task) => {
      if (map[task.status]) {
        map[task.status].push(task);
      } else {
        map['Todo'].push(task);
      }
    });

    // Ensure sorted deterministically by position
    Object.keys(map).forEach((col) => {
      map[col].sort((a, b) => a.position - b.position);
    });

    return map;
  }, [filteredTasks]);

  if (loading && !currentBoard) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading board workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentBoard) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-rose-200 text-center max-w-md shadow-sm">
            <h3 className="text-base font-bold text-rose-700 mb-2">Board Access Error</h3>
            <p className="text-xs text-slate-600 mb-4">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Board Top Navigation & Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center space-x-1 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Boards</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-400">
                Rev #{currentBoard?.revision || 1}
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentBoard?.title}
            </h1>
            {currentBoard?.description && (
              <p className="text-xs text-slate-500">{currentBoard.description}</p>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Members overview */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
              <Users className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <span className="font-semibold text-slate-700">
                {currentBoard?.members?.length || 1}
              </span>
              <span className="text-slate-400">members</span>
            </div>

            {/* Invite button */}
            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Invite</span>
            </button>

            {/* Analytics button */}
            <button
              type="button"
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Analytics</span>
            </button>

            {/* Activity feed button */}
            <button
              type="button"
              onClick={() => setIsActivityOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Activity</span>
            </button>

            {/* Create Task button */}
            <button
              type="button"
              onClick={() => setActiveTaskModal({ mode: 'create', defaultStatus: 'Todo' })}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar members={currentBoard?.members || []} />

        {/* Drag and Drop Kanban Board Columns Container */}
        <div className="flex-1 overflow-x-auto pb-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex items-start space-x-4 min-w-[1160px] pb-4">
              {COLUMNS.map((status) => (
                <Column
                  key={status}
                  status={status}
                  tasks={tasksByColumn[status] || []}
                  onAddTask={(colStatus) =>
                    setActiveTaskModal({ mode: 'create', defaultStatus: colStatus })
                  }
                  onEditTask={(task) =>
                    setActiveTaskModal({ mode: 'edit', task })
                  }
                />
              ))}
            </div>
          </DragDropContext>
        </div>
      </main>

      {/* Task Dialog Modal */}
      {activeTaskModal && (
        <TaskModal
          task={activeTaskModal.task}
          defaultStatus={activeTaskModal.defaultStatus}
          onClose={() => setActiveTaskModal(null)}
        />
      )}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <InviteMemberModal
          boardId={boardId}
          onClose={() => setIsInviteOpen(false)}
          onMemberInvited={() => fetchBoardDetails(boardId)}
        />
      )}

      {/* Analytics Modal */}
      {isAnalyticsOpen && (
        <AnalyticsModal
          boardId={boardId}
          onClose={() => setIsAnalyticsOpen(false)}
        />
      )}

      {/* Activity Timeline Drawer */}
      <ActivityDrawer
        boardId={boardId}
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />

      {/* Concurrency Conflict Toast */}
      <ConflictToast />
    </div>
  );
}
