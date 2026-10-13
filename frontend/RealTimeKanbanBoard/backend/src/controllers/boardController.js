import { BoardService } from '../services/boardService.js';

export class BoardController {
  static async createBoard(req, res, next) {
    try {
      const { title, description } = req.body;
      const board = await BoardService.createBoard(title, description, req.user.id);
      return res.status(201).json({
        success: true,
        board,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBoards(req, res, next) {
    try {
      const boards = await BoardService.getUserBoards(req.user.id);
      return res.status(200).json({
        success: true,
        boards,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBoardById(req, res, next) {
    try {
      const { boardId } = req.params;
      const data = await BoardService.getBoardDetails(boardId, req.user.id);
      return res.status(200).json({
        success: true,
        ...data,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  static async updateBoard(req, res, next) {
    try {
      const { boardId } = req.params;
      const { title, description } = req.body;
      const socketEmitter = req.app.get('socketEmitter');

      const board = await BoardService.updateBoard(
        boardId,
        req.user.id,
        { title, description },
        socketEmitter
      );

      return res.status(200).json({
        success: true,
        board,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  static async inviteMember(req, res, next) {
    try {
      const { boardId } = req.params;
      const { email, role } = req.body;
      const socketEmitter = req.app.get('socketEmitter');

      const board = await BoardService.inviteMember(
        boardId,
        req.user.id,
        email,
        role,
        socketEmitter
      );

      return res.status(200).json({
        success: true,
        board,
        message: 'Member invited successfully.',
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  static async removeMember(req, res, next) {
    try {
      const { boardId, userId } = req.params;
      const socketEmitter = req.app.get('socketEmitter');

      const board = await BoardService.removeMember(
        boardId,
        req.user.id,
        userId,
        socketEmitter
      );

      return res.status(200).json({
        success: true,
        board,
        message: 'Member removed successfully.',
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  static async getBoardActivity(req, res, next) {
    try {
      const { boardId } = req.params;
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);

      const result = await BoardService.getBoardActivity(boardId, page, limit);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBoardAnalytics(req, res, next) {
    try {
      const { boardId } = req.params;
      const analytics = await BoardService.getBoardAnalytics(boardId);
      return res.status(200).json({
        success: true,
        analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}
