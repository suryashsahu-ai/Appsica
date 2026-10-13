import { Router } from 'express';
import { TaskController } from '../controllers/taskController.js';
import { CommentController } from '../controllers/commentController.js';
import { authenticateJWT, requireUser } from '../middleware/auth.js';
import { validateMoveTask } from '../validators/taskValidators.js';

const router = Router();

router.use(authenticateJWT, requireUser);

// Task item routes
router.get('/:taskId', TaskController.getTaskById);
router.patch('/:taskId', TaskController.updateTask);
router.patch('/:taskId/move', validateMoveTask, TaskController.moveTask);
router.delete('/:taskId', TaskController.deleteTask);

// Task comments
router.get('/:taskId/comments', CommentController.getComments);
router.post('/:taskId/comments', CommentController.createComment);

export default router;
