import mongoose from 'mongoose';
import { Board } from '../models/Board.js';

/**
 * Middleware to verify that the authenticated user is an authorized member of the specified board
 * @param {string[]} allowedRoles Array of allowed member roles (defaults to ['owner', 'admin', 'member'])
 */
export function requireBoardMember(allowedRoles = ['owner', 'admin', 'member']) {
  return async (req, res, next) => {
    try {
      const boardId = req.params.boardId || req.body.boardId || req.query.boardId;

      if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or missing board ID parameter.',
        });
      }

      // Admin role cannot silently access private boards unless explicitly granted
      if (req.user.role === 'admin' && req.user.tokenType === 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Admin tokens cannot access private board workspaces.',
        });
      }

      const board = await Board.findById(boardId);
      if (!board) {
        return res.status(404).json({
          success: false,
          error: 'Board not found.',
        });
      }

      // Check membership
      const membership = board.members.find(
        (m) => m.user.toString() === req.user.id
      );

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You are not a member of this board.',
        });
      }

      // Role check
      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: Requires one of [${allowedRoles.join(', ')}] role on this board.`,
        });
      }

      req.board = board;
      req.membership = membership;
      next();
    } catch (error) {
      console.error('[Board Auth Error]', error.message);
      return res.status(500).json({
        success: false,
        error: 'Internal server error verifying board permissions.',
      });
    }
  };
}
