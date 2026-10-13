import { TaskService } from '../services/taskService.js';
import { Task } from '../models/Task.js';

export class TaskController {
  static async createTask(req, res, next) {
    try {
      const { boardId } = req.params;
      const socketEmitter = req.app.get('socketEmitter');

      const result = await TaskService.createTask(
        boardId,
        req.user.id,
        req.body,
        socketEmitter
      );

      return res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  static async getTasks(req, res, next) {
    try {
      const { boardId } = req.params;
      const { priority, assignee, status, due } = req.query;

      const query = { board: boardId };

      if (priority) {
        query.priority = priority;
      }
      if (assignee) {
        query.assignee = assignee;
      }
      if (status) {
        query.status = status;
      }

      if (due) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (due === 'overdue') {
          query.dueDate = { $lt: startOfDay, $ne: null };
          query.status = { $ne: 'Done' };
        } else if (due === 'today') {
          query.dueDate = { $gte: startOfDay, $lte: endOfDay };
        } else if (due === 'upcoming') {
          query.dueDate = { $gt: endOfDay };
        }
      }

      const tasks = await Task.find(query)
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email')
        .sort({ position: 1, _id: 1 });

      return res.status(200).json({
        success: true,
        tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req, res, next) {
    try {
      const { taskId } = req.params;
      const task = await Task.findById(taskId)
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email');

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found.',
        });
      }

      return res.status(200).json({
        success: true,
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const socketEmitter = req.app.get('socketEmitter');

      const result = await TaskService.updateTask(
        taskId,
        req.user.id,
        req.body,
        socketEmitter
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  static async moveTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const socketEmitter = req.app.get('socketEmitter');

      const result = await TaskService.moveTask(
        taskId,
        req.user.id,
        req.body,
        socketEmitter
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
          ...(error.currentRevision !== undefined ? { currentRevision: error.currentRevision } : {}),
        });
      }
      next(error);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const socketEmitter = req.app.get('socketEmitter');

      const result = await TaskService.deleteTask(taskId, req.user.id, socketEmitter);

      return res.status(200).json({
        success: true,
        ...result,
        message: 'Task deleted successfully.',
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
