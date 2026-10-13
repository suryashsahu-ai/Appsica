import { Task } from '../models/Task.js';
import { Board } from '../models/Board.js';
import { Activity } from '../models/Activity.js';
import { Comment } from '../models/Comment.js';

export class TaskService {
  /**
   * Create a new task in a board
   */
  static async createTask(boardId, userId, taskData, emitSocketEvent = null) {
    const board = await Board.findById(boardId);
    if (!board) {
      throw { status: 404, message: 'Board not found.' };
    }

    // Verify user is a member
    const isMember = board.members.some((m) => m.user.toString() === userId);
    if (!isMember) {
      throw { status: 403, message: 'Forbidden: You are not a member of this board.' };
    }

    // If assignee provided, verify assignee is a member
    if (taskData.assignee) {
      const isAssigneeMember = board.members.some((m) => m.user.toString() === taskData.assignee.toString());
      if (!isAssigneeMember) {
        throw { status: 400, message: 'Assignee must be an active member of this board.' };
      }
    }

    const status = taskData.status || 'Todo';

    // Find the next position in the column
    const highestTask = await Task.findOne({ board: boardId, status }).sort({ position: -1 }).select('position');
    const nextPosition = highestTask ? highestTask.position + 1 : 0;

    const task = new Task({
      ...taskData,
      status,
      position: nextPosition,
      board: boardId,
      createdBy: userId,
      revision: 1,
    });

    await task.save();

    // Increment board revision
    board.revision += 1;
    await board.save();

    // Populate user references for clean response
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    // Create activity record
    const activity = await Activity.create({
      board: boardId,
      actor: userId,
      actionType: 'TASK_CREATED',
      task: task._id,
      metadata: { title: task.title, status: task.status, priority: task.priority },
    });
    await activity.populate('actor', 'name email');

    if (emitSocketEvent) {
      emitSocketEvent(boardId, 'task:created', { task, boardRevision: board.revision });
      emitSocketEvent(boardId, 'activity:created', activity);
    }

    return { task, boardRevision: board.revision };
  }

  /**
   * Update task fields (title, description, priority, dueDate, assignee)
   */
  static async updateTask(taskId, userId, updateData, emitSocketEvent = null) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw { status: 404, message: 'Task not found.' };
    }

    const board = await Board.findById(task.board);
    if (!board) {
      throw { status: 404, message: 'Associated board not found.' };
    }

    // Member check
    const isMember = board.members.some((m) => m.user.toString() === userId);
    if (!isMember) {
      throw { status: 403, message: 'Forbidden: You are not a member of this board.' };
    }

    // Verify assignee if modified
    if (updateData.assignee !== undefined) {
      if (updateData.assignee) {
        const isAssigneeMember = board.members.some((m) => m.user.toString() === updateData.assignee.toString());
        if (!isAssigneeMember) {
          throw { status: 400, message: 'Assignee must be an active member of this board.' };
        }
        task.assignee = updateData.assignee;
      } else {
        task.assignee = null;
      }
    }

    if (updateData.title !== undefined) task.title = updateData.title;
    if (updateData.description !== undefined) task.description = updateData.description;
    if (updateData.priority !== undefined) task.priority = updateData.priority;
    if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;

    task.revision += 1;
    await task.save();

    board.revision += 1;
    await board.save();

    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    const activity = await Activity.create({
      board: board._id,
      actor: userId,
      actionType: 'TASK_UPDATED',
      task: task._id,
      metadata: { title: task.title, priority: task.priority },
    });
    await activity.populate('actor', 'name email');

    if (emitSocketEvent) {
      emitSocketEvent(board._id.toString(), 'task:updated', { task, boardRevision: board.revision });
      emitSocketEvent(board._id.toString(), 'activity:created', activity);
    }

    return { task, boardRevision: board.revision };
  }

  /**
   * Move or Reorder a task with Optimistic Concurrency Control
   */
  static async moveTask(taskId, userId, { destinationStatus, destinationPosition, expectedBoardRevision }, emitSocketEvent = null) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw { status: 404, message: 'Task not found.' };
    }

    const board = await Board.findById(task.board);
    if (!board) {
      throw { status: 404, message: 'Associated board not found.' };
    }

    // Membership authorization
    const isMember = board.members.some((m) => m.user.toString() === userId);
    if (!isMember) {
      throw { status: 403, message: 'Forbidden: You are not a member of this board.' };
    }

    // Optimistic Concurrency Control (OCC) Check
    if (expectedBoardRevision !== undefined && expectedBoardRevision !== board.revision) {
      throw {
        status: 409,
        message: 'Conflict: Board has been updated by another collaborator. Refreshing latest state.',
        currentRevision: board.revision,
      };
    }

    const sourceStatus = task.status;
    const targetStatus = destinationStatus;

    if (sourceStatus === targetStatus) {
      // Reordering within the same column
      const tasksInCol = await Task.find({ board: board._id, status: sourceStatus }).sort({ position: 1, _id: 1 });
      const filtered = tasksInCol.filter((t) => t._id.toString() !== task._id.toString());
      
      const targetPos = Math.max(0, Math.min(destinationPosition, filtered.length));
      filtered.splice(targetPos, 0, task);

      // Reassign deterministic positions
      const bulkOps = filtered.map((t, index) => ({
        updateOne: {
          filter: { _id: t._id },
          update: { $set: { position: index, ...(t._id.equals(task._id) ? { revision: task.revision + 1 } : {}) } },
        },
      }));

      if (bulkOps.length > 0) {
        await Task.bulkWrite(bulkOps);
      }
    } else {
      // Moving across columns
      // 1. Re-normalize source column
      const sourceCol = await Task.find({ board: board._id, status: sourceStatus }).sort({ position: 1, _id: 1 });
      const filteredSource = sourceCol.filter((t) => t._id.toString() !== task._id.toString());
      const sourceBulk = filteredSource.map((t, index) => ({
        updateOne: {
          filter: { _id: t._id },
          update: { $set: { position: index } },
        },
      }));
      if (sourceBulk.length > 0) {
        await Task.bulkWrite(sourceBulk);
      }

      // 2. Re-normalize destination column
      const destCol = await Task.find({ board: board._id, status: targetStatus }).sort({ position: 1, _id: 1 });
      const targetPos = Math.max(0, Math.min(destinationPosition, destCol.length));
      destCol.splice(targetPos, 0, task);

      const destBulk = destCol.map((t, index) => ({
        updateOne: {
          filter: { _id: t._id },
          update: {
            $set: {
              position: index,
              ...(t._id.equals(task._id)
                ? { status: targetStatus, revision: task.revision + 1 }
                : {}),
            },
          },
        },
      }));
      if (destBulk.length > 0) {
        await Task.bulkWrite(destBulk);
      }
    }

    // Increment board revision
    board.revision += 1;
    await board.save();

    // Fetch refreshed task
    const updatedTask = await Task.findById(taskId)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    // Record activity
    const activity = await Activity.create({
      board: board._id,
      actor: userId,
      actionType: 'TASK_MOVED',
      task: updatedTask._id,
      metadata: {
        title: updatedTask.title,
        fromStatus: sourceStatus,
        toStatus: targetStatus,
        newPosition: updatedTask.position,
      },
    });
    await activity.populate('actor', 'name email');

    if (emitSocketEvent) {
      emitSocketEvent(board._id.toString(), 'task:moved', {
        task: updatedTask,
        fromStatus: sourceStatus,
        toStatus: targetStatus,
        boardRevision: board.revision,
      });
      emitSocketEvent(board._id.toString(), 'activity:created', activity);
    }

    return { task: updatedTask, boardRevision: board.revision };
  }

  /**
   * Delete a task and re-normalize remaining column positions
   */
  static async deleteTask(taskId, userId, emitSocketEvent = null) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw { status: 404, message: 'Task not found.' };
    }

    const board = await Board.findById(task.board);
    if (!board) {
      throw { status: 404, message: 'Associated board not found.' };
    }

    // Verify member
    const isMember = board.members.some((m) => m.user.toString() === userId);
    if (!isMember) {
      throw { status: 403, message: 'Forbidden: You are not a member of this board.' };
    }

    const status = task.status;
    const taskTitle = task.title;

    // Delete comments for task
    await Comment.deleteMany({ task: taskId });
    await Task.findByIdAndDelete(taskId);

    // Re-normalize positions of remaining tasks in column
    const remainingTasks = await Task.find({ board: board._id, status }).sort({ position: 1, _id: 1 });
    const bulkOps = remainingTasks.map((t, index) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: { position: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await Task.bulkWrite(bulkOps);
    }

    board.revision += 1;
    await board.save();

    const activity = await Activity.create({
      board: board._id,
      actor: userId,
      actionType: 'TASK_DELETED',
      task: null,
      metadata: { title: taskTitle, status },
    });
    await activity.populate('actor', 'name email');

    if (emitSocketEvent) {
      emitSocketEvent(board._id.toString(), 'task:deleted', {
        taskId,
        status,
        boardRevision: board.revision,
      });
      emitSocketEvent(board._id.toString(), 'activity:created', activity);
    }

    return { success: true, taskId, boardRevision: board.revision };
  }
}
