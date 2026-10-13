import { CommentService } from '../services/commentService.js';

export class CommentController {
  static async createComment(req, res, next) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Comment content cannot be empty.',
        });
      }

      if (content.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Comment cannot exceed 2000 characters.',
        });
      }

      const socketEmitter = req.app.get('socketEmitter');
      const comment = await CommentService.createComment(
        taskId,
        req.user.id,
        content,
        socketEmitter
      );

      return res.status(201).json({
        success: true,
        comment,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  static async getComments(req, res, next) {
    try {
      const { taskId } = req.params;
      const comments = await CommentService.getTaskComments(taskId, req.user.id);

      return res.status(200).json({
        success: true,
        comments,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  static async deleteComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const socketEmitter = req.app.get('socketEmitter');

      const result = await CommentService.deleteComment(
        commentId,
        req.user.id,
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
}
