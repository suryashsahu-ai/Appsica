import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticateJWT, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Strictly protected by authenticateJWT and requireAdmin
router.use(authenticateJWT, requireAdmin);

router.get('/system-stats', AdminController.getSystemStats);
router.get('/users', AdminController.listUsers);
router.patch('/users/:userId/status', AdminController.toggleUserStatus);

export default router;
