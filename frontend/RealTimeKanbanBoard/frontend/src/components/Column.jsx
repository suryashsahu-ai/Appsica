import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard.jsx';
import { Plus } from 'lucide-react';

const COLUMN_CONFIG = {
  Todo: {
    title: 'To Do',
    borderTop: 'border-blue-500',
    countBadge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  'In Progress': {
    title: 'In Progress',
    borderTop: 'border-amber-500',
    countBadge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  Review: {
    title: 'Review',
    borderTop: 'border-purple-500',
    countBadge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
  },
  Done: {
    title: 'Done',
    borderTop: 'border-emerald-500',
    countBadge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
};

export function Column({ status, tasks, onAddTask, onEditTask }) {
  const config = COLUMN_CONFIG[status] || {
    title: status,
    borderTop: 'border-slate-500',
    countBadge: 'bg-slate-100 text-slate-800',
    dot: 'bg-slate-500',
  };

  return (
    <div className="flex flex-col bg-slate-100/80 rounded-2xl p-3 sm:p-4 min-w-[280px] sm:min-w-[320px] max-w-[360px] flex-1 border border-slate-200/80 shadow-xs">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`}></span>
          <h3 className="font-bold text-slate-800 text-sm">{config.title}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${config.countBadge}`}
          >
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="p-1 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-colors shadow-2xs hover:shadow-xs"
          title={`Add task to ${config.title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Droppable Task Container */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[300px] rounded-xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-50/50 ring-2 ring-indigo-300 ring-dashed' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onEdit={onEditTask}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                <span>No tasks yet</span>
                <button
                  type="button"
                  onClick={() => onAddTask(status)}
                  className="mt-1.5 text-indigo-600 hover:underline font-semibold"
                >
                  + Add one
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
