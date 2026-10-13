import { Board } from '../models/Board.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';

export class BoardService {
  /**
   * Create a new board with the creator as owner
   */
  static async createBoard(title, description, userId) {
    const board = new Board({
      title,
      description: description || '',
      createdBy: userId,
      members: [
        {
          user: userId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      revision: 1,
    });

    await board.save();
    await board.populate('members.user', 'name email');
    await board.populate('createdBy', 'name email');

    return board;
  }

  /**
   * List all boards accessible to the specified user
   */
  static async getUserBoards(userId) {
    const boards = await Board.find({ 'members.user': userId })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    // Aggregate task counts per board
    const boardIds = boards.map((b) => b._id);
    const taskCounts = await Task.aggregate([
      { $match: { board: { $in: boardIds } } },
      { $group: { _id: '$board', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    taskCounts.forEach((tc) => {
      countMap[tc._id.toString()] = tc.count;
    });

    return boards.map((b) => {
      const bObj = b.toJSON();
      bObj.taskCount = countMap[b._id.toString()] || 0;
      return bObj;
    });
  }

  /**
   * Get full board details including tasks
   */
  static async getBoardDetails(boardId, userId) {
    const board = await Board.findById(boardId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    if (!board) {
      throw { status: 404, message: 'Board not found.' };
    }

    const isMember = board.members.some((m) => m.user._id.toString() === userId);
    if (!isMember) {
      throw { status: 403, message: 'Access denied: You are not a member of this board.' };
    }

    const tasks = await Task.find({ board: boardId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ position: 1, _id: 1 });

    return {
      board,
      tasks,
    };
  }

  /**
   * Update board metadata (title, description)
   */
  static async updateBoard(boardId, userId, { title, description }, emitSocketEvent = null) {
    const board = await Board.findById(boardId);
    if (!board) {
      throw { status: 404, message: 'Board not found.' };
    }

    const membership = board.members.find((m) => m.user.toString() === userId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw { status: 403, message: 'Permission denied: Only board owners or admins can edit board metadata.' };
    }

    if (title) board.title = title.trim();
    if (description !== undefined) board.description = description.trim();
    board.revision += 1;

    await board.save();
    await board.populate('members.user', 'name email');
    await board.populate('createdBy', 'name email');

    const activity = await Activity.create({
      board: board._id,
      actor: userId,
      actionType: 'BOARD_UPDATED',
      metadata: { title: board.title },
    });
    await activity.populate('actor', 'name email');

    if (emitSocketEvent) {
      emitSocketEvent(board._id.toString(), 'board:state', { board });
      emitSocketEvent(board._id.toString(), 'activity:created', activity);
    }

    return board;
  }

  /**
   * Invite an existing registered user to a board
   */
  static async inviteMember(boardId, inviterId, email, role = 'member', emitSocketEvent = null) {
    const board = await Board.findById(boardId);
    if (!board) {
      throw { status: 404, message: 'Board not found.' };
    }

    const inviterMembership = board.members.find((m) => m.user.toString() === inviterId);
    if (!inviterMembership || !['owner', 'admin'].includes(inviterMembership.role)) {
      throw { status: 403, message: 'Permission denied: Only board owners or admins can invite new members.' };
    }

    const userToInvite = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToInvite) {
      throw { status: 404, message: 'No registered user found with that email address.' };
    }

    const alreadyMember = board.members.some((m) => m.user.toString() === userToInvite._id.toString());
    if (alreadyMember) {
      throw { status: 409, message: 'User is already a member of this board.' };
    }

    board.members.push({
      user: userToInvite._id,
      role: role || 'member',
      joinedAt: new Date(),
    });
    board.revision += 1;

    await board.save();
    await board.populate('members.user', 'name email');
    await board.populate('createdBy', 'name email');

    const activity = await Activity.create({
      board: board._id,
      actor: inviterId,
      actionType: 'MEMBER_INVITED',
      metadata: { invitedUser: userToInvite.name, email: userToInvite.email, role },
    });
    await activity.populate('actor', 'name email');

    if (emitSocketEvent) {
      emitSocketEvent(board._id.toString(), 'board:state', { board });
      emitSocketEvent(board._id.toString(), 'activity:created', activity);
    }

    return board;
  }

  /**
   * Remove a member from the board and clear their task assignments
   */
  static async removeMember(boardId, removerId, memberUserId, emitSocketEvent = null) {
    const board = await Board.findById(boardId);
    if (!board) {
      throw { status: 404, message: 'Board not found.' };
    }

    const removerMembership = board.members.find((m) => m.user.toString() === removerId);
    if (!removerMembership || !['owner', 'admin'].includes(removerMembership.role)) {
      throw { status: 403, message: 'Permission denied: Only board owners or admins can remove members.' };
    }

    if (board.createdBy.toString() === memberUserId) {
      throw { status: 400, message: 'Cannot remove the board creator/owner.' };
    }

    const memberExists = board.members.some((m) => m.user.toString() === memberUserId);
    if (!memberExists) {
      throw { status: 404, message: 'User is not a member of this board.' };
    }

    board.members = board.members.filter((m) => m.user.toString() !== memberUserId);
    board.revision += 1;
    await board.save();

    // Clear assignments on tasks
    await Task.updateMany(
      { board: boardId, assignee: memberUserId },
      { $set: { assignee: null } }
    );

    const removedUser = await User.findById(memberUserId).select('name email');

    const activity = await Activity.create({
      board: board._id,
      actor: removerId,
      actionType: 'MEMBER_REMOVED',
      metadata: { removedUserName: removedUser?.name || 'Member' },
    });
    await activity.populate('actor', 'name email');

    await board.populate('members.user', 'name email');
    await board.populate('createdBy', 'name email');

    if (emitSocketEvent) {
      emitSocketEvent(board._id.toString(), 'board:state', { board });
      emitSocketEvent(board._id.toString(), 'activity:created', activity);
    }

    return board;
  }

  /**
   * Get paginated board activity
   */
  static async getBoardActivity(boardId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      Activity.find({ board: boardId })
        .populate('actor', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({ board: boardId }),
    ]);

    return {
      activities,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Calculate board analytics
   */
  static async getBoardAnalytics(boardId) {
    const tasks = await Task.find({ board: boardId });
    const now = new Date();

    const countsByStatus = {
      Todo: 0,
      'In Progress': 0,
      Review: 0,
      Done: 0,
    };

    const countsByPriority = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    let overdueCount = 0;

    tasks.forEach((task) => {
      if (countsByStatus[task.status] !== undefined) {
        countsByStatus[task.status] += 1;
      }
      if (countsByPriority[task.priority] !== undefined) {
        countsByPriority[task.priority] += 1;
      }
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Done') {
        overdueCount += 1;
      }
    });

    return {
      totalTasks: tasks.length,
      countsByStatus,
      countsByPriority,
      completedTasks: countsByStatus['Done'],
      overdueTasks: overdueCount,
    };
  }
}
