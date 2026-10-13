import { Router } from 'express';
import { BoardController } from '../controllers/boardController.js';
import { TaskController } from '../controllers/taskController.js';
import { authenticateJWT, requireUser } from '../middleware/auth.js';
import { requireBoardMember } from '../middleware/boardAuth.js';
import {
  validateCreateBoard,
  validateInviteMember,
} from '../validators/boardValidators.js';
import { validateCreateTask } from '../validators/taskValidators.js';

const router = Router();

// All board operations require an authenticated regular user (admin tokens cannot access private boards)
router.use(authenticateJWT, requireUser);

// Board collection routes
router.get('/', BoardController.getBoards);
router.post('/', validateCreateBoard, BoardController.createBoard);

// Board item routes
router.get('/:boardId', requireBoardMember(), BoardController.getBoardById);
router.patch('/:boardId', requireBoardMember(['owner', 'admin']), BoardController.updateBoard);

// Membership routes
router.post(
  '/:boardId/members',
  requireBoardMember(['owner', 'admin']),
  validateInviteMember,
  BoardController.inviteMember
);
router.delete(
  '/:boardId/members/:userId',
  requireBoardMember(['owner', 'admin']),
  BoardController.removeMember
);

// Board task routes
router.get('/:boardId/tasks', requireBoardMember(), TaskController.getTasks);
router.post('/:boardId/tasks', requireBoardMember(), validateCreateTask, TaskController.createTask);

// Activity and analytics routes
router.get('/:boardId/activity', requireBoardMember(), BoardController.getBoardActivity);
router.get('/:boardId/analytics', requireBoardMember(), BoardController.getBoardAnalytics);

export default router;
