import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useBoardStore } from '../store/useBoardStore.js';
import { Calendar, User, ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';

const PRIORITY_STYLES = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_ORDER = ['Todo', 'In Progress', 'Review', 'Done'];

export function TaskCard({ task, index, onEdit }) {
  const { typingUsers, moveTask } = useBoardStore();
  const typingUser = typingUsers[task._id];

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  // Keyboard accessibility move handlers
  const currentStatusIdx = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = currentStatusIdx > 0;
  const canMoveRight = currentStatusIdx < STATUS_ORDER.length - 1;

  const handleMoveLeft = (e) => {
    e.stopPropagation();
    if (canMoveLeft) {
      moveTask(task._id, STATUS_ORDER[currentStatusIdx - 1], 0);
    }
  };

  const handleMoveRight = (e) => {
    e.stopPropagation();
    if (canMoveRight) {
      moveTask(task._id, STATUS_ORDER[currentStatusIdx + 1], 0);
    }
  };

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(task)}
          className={`bg-white rounded-xl border p-4 mb-3 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none ${
            snapshot.isDragging
              ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-200 rotate-1 scale-102 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          {/* Header: Priority & Typing indicator */}
          <div className="flex items-center justify-between mb-2.5">
            <span
              className={`text-xs px-2 py-0.5 font-semibold rounded-md border ${
                PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium
              }`}
            >
              {task.priority}
            </span>

            {typingUser && (
              <span className="text-[11px] font-medium text-indigo-600 animate-pulse flex items-center">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1 animate-ping"></span>
                {typingUser} is editing...
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {task.title}
          </h4>

          {/* Description snippet if present */}
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata Footer */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-3">
              {/* Due Date */}
              {task.dueDate && (
                <div
                  className={`flex items-center space-x-1 font-medium ${
                    isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                  }`}
                  title={isOverdue ? 'Task is overdue!' : 'Due date'}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Assignee Avatar / Name */}
              {task.assignee ? (
                <div
                  className="flex items-center space-x-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full"
                  title={`Assigned to ${task.assignee.name} (${task.assignee.email})`}
                >
                  <div className="w-4 h-4 rounded-full bg-indigo-500 text-white font-bold text-[9px] flex items-center justify-center">
                    {task.assignee.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[90px]">{task.assignee.name}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  <span>Unassigned</span>
                </div>
              )}
            </div>

            {/* Quick accessibility keyboard/touch move controls */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canMoveLeft && (
                <button
                  type="button"
                  onClick={handleMoveLeft}
                  title={`Move to ${STATUS_ORDER[currentStatusIdx - 1]}`}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-indigo-600"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              {canMoveRight && (
                <button
                  type="button"
                  onClick={handleMoveRight}
                  title={`Move to ${STATUS_ORDER[currentStatusIdx + 1]}`}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-indigo-600"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
