import { User } from '../models/User.js';
import { Board } from '../models/Board.js';
import { Task } from '../models/Task.js';

export class AdminController {
  /**
   * System-wide statistics for administrative audit
   */
  static async getSystemStats(req, res, next) {
    try {
      const [totalUsers, totalBoards, totalTasks] = await Promise.all([
        User.countDocuments(),
        Board.countDocuments(),
        Task.countDocuments(),
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          totalBoards,
          totalTasks,
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all registered users for administration
   */
  static async listUsers(req, res, next) {
    try {
      const users = await User.find()
        .select('name email role isActive createdAt updatedAt')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle user active/disabled status
   */
  static async toggleUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isActive boolean flag is required.',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.',
        });
      }

      user.isActive = isActive;
      await user.save();

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
        },
        message: `User account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
