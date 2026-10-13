import { Comment } from '../models/Comment.js';
import { Task } from '../models/Task.js';
import { Board } from '../models/Board.js';
import { Activity } from '../models/Activity.js';

export class CommentService {
  /**
   * Add a comment to a task
   */
  static async createComment(taskId, authorId, content, emitSocketEvent = null) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw { status: 404, message: 'Task not found.' };
    }

    const board = await Board.findById(task.board);
    if (!board) {
      throw { status: 404, message: 'Board not found.' };
    }

    // Verify member
    const isMember = board.members.some((m) => m.user.toString() === authorId);
    if (!isMember) {
      throw { status: 403, message: 'Forbidden: You are not a member of this board.' };
    }

    const comment = new Comment({
      task: taskId,
      board: board._id,
      author: authorId,
      content: content.trim(),
    });

    await comment.save();
    await comment.populate('author', 'name email');

    const activity = await Activity.create({
      board: board._id,
      actor: authorId,
      actionType: 'COMMENT_ADDED',
      task: task._id,
      metadata: { taskTitle: task.title },
    });
    await activity.populate('actor', 'name email');

    if (emitSocketEvent) {
      emitSocketEvent(board._id.toString(), 'comment:created', { comment, taskId });
      emitSocketEvent(board._id.toString(), 'activity:created', activity);
    }

    return comment;
  }

  /**
   * Get all comments for a task
   */
  static async getTaskComments(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw { status: 404, message: 'Task not found.' };
    }

    const board = await Board.findById(task.board);
    if (!board) {
      throw { status: 404, message: 'Board not found.' };
    }

    const isMember = board.members.some((m) => m.user.toString() === userId);
    if (!isMember) {
      throw { status: 403, message: 'Forbidden: You are not a member of this board.' };
    }

    const comments = await Comment.find({ task: taskId })
      .populate('author', 'name email')
      .sort({ createdAt: 1 });

    return comments;
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId, userId, emitSocketEvent = null) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw { status: 404, message: 'Comment not found.' };
    }

    const board = await Board.findById(comment.board);
    const membership = board?.members.find((m) => m.user.toString() === userId);

    const isAuthor = comment.author.toString() === userId;
    const isBoardAdminOrOwner = membership && ['owner', 'admin'].includes(membership.role);

    if (!isAuthor && !isBoardAdminOrOwner) {
      throw { status: 403, message: 'Forbidden: You do not have permission to delete this comment.' };
    }

    await Comment.findByIdAndDelete(commentId);

    if (emitSocketEvent && board) {
      emitSocketEvent(board._id.toString(), 'comment:deleted', {
        commentId,
        taskId: comment.task.toString(),
      });
    }

    return { success: true };
  }
}
