import mongoose from 'mongoose';
import { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';

export function validateCreateTask(req, res, next) {
  const { title, description, priority, status, dueDate, assignee } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 150) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required and must be between 1 and 150 characters.',
    });
  }

  if (description && (typeof description !== 'string' || description.trim().length > 2000)) {
    return res.status(400).json({
      success: false,
      error: 'Task description cannot exceed 2000 characters.',
    });
  }

  if (priority && !TASK_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      error: `Invalid priority. Allowed values: ${TASK_PRIORITIES.join(', ')}.`,
    });
  }

  if (status && !TASK_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Allowed values: ${TASK_STATUSES.join(', ')}.`,
    });
  }

  if (dueDate) {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid due date format.',
      });
    }
  }

  if (assignee && !mongoose.Types.ObjectId.isValid(assignee)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid assignee user ID.',
    });
  }

  next();
}

export function validateMoveTask(req, res, next) {
  const { destinationStatus, destinationPosition, expectedBoardRevision } = req.body;

  if (!destinationStatus || !TASK_STATUSES.includes(destinationStatus)) {
    return res.status(400).json({
      success: false,
      error: `Invalid destinationStatus. Allowed values: ${TASK_STATUSES.join(', ')}.`,
    });
  }

  if (destinationPosition === undefined || typeof destinationPosition !== 'number' || destinationPosition < 0) {
    return res.status(400).json({
      success: false,
      error: 'destinationPosition must be a non-negative number.',
    });
  }

  if (expectedBoardRevision !== undefined && (typeof expectedBoardRevision !== 'number' || expectedBoardRevision < 1)) {
    return res.status(400).json({
      success: false,
      error: 'expectedBoardRevision must be a positive integer.',
    });
  }

  next();
}
