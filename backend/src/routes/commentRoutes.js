import { Router } from 'express';
import { CommentController } from '../controllers/commentController.js';
import { authenticateJWT, requireUser } from '../middleware/auth.js';

const router = Router();

router.use(authenticateJWT, requireUser);

router.delete('/:commentId', CommentController.deleteComment);

export default router;
