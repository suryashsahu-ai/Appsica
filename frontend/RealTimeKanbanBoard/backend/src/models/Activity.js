import mongoose from 'mongoose';

export const ACTIVITY_ACTIONS = [
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_MOVED',
  'TASK_REORDERED',
  'TASK_DELETED',
  'MEMBER_INVITED',
  'MEMBER_REMOVED',
  'COMMENT_ADDED',
  'BOARD_UPDATED',
];

const activitySchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      enum: ACTIVITY_ACTIONS,
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

activitySchema.index({ board: 1, timestamp: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
