import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Boards, Tasks & Concurrency Control', () => {
  let user1Token, _user1Id;
  let user2Token, user2Id;
  let adminToken;

  beforeEach(async () => {
    // Register User 1
    const u1Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User One', email: 'u1@example.com', password: 'Password123!' });
    user1Token = u1Res.body.token;
    _user1Id = u1Res.body.user.id;

    // Register User 2
    const u2Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User Two', email: 'u2@example.com', password: 'Password123!' });
    user2Token = u2Res.body.token;
    user2Id = u2Res.body.user.id;

    // Admin login
    const adminRes = await request(app)
      .post('/api/auth/admin/login')
      .send({ adminId: 'test_admin_id', password: 'TestAdminPassword123!' });
    adminToken = adminRes.body.token;
  });

  it('creates board and makes creator the owner', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Sprint Board 1', description: 'Testing Kanban' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.board.title).toBe('Sprint Board 1');
    expect(res.body.board.members.length).toBe(1);
    expect(res.body.board.members[0].role).toBe('owner');
    expect(res.body.board.revision).toBe(1);
  });

  it('prevents non-member from accessing private board', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Private Board' });
    const boardId = boardRes.body.board._id;

    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('You are not a member of this board');
  });

  it('prevents admin token from viewing private board directly', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Confidential Workspace' });
    const boardId = boardRes.body.board._id;

    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  it('invites a registered member to the board', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Collaborative Board' });
    const boardId = boardRes.body.board._id;

    const inviteRes = await request(app)
      .post(`/api/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ email: 'u2@example.com', role: 'member' });

    expect(inviteRes.status).toBe(200);
    expect(inviteRes.body.board.members.length).toBe(2);

    // User 2 can now access the board
    const accessRes = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(accessRes.status).toBe(200);
  });

  it('creates tasks and respects deterministic column positions', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Task Ordering Board' });
    const boardId = boardRes.body.board._id;

    // Create task 1
    const t1 = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'First Task', priority: 'High', status: 'Todo' });
    expect(t1.status).toBe(201);
    expect(t1.body.task.position).toBe(0);

    // Create task 2
    const t2 = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Second Task', priority: 'Medium', status: 'Todo' });
    expect(t2.status).toBe(201);
    expect(t2.body.task.position).toBe(1);

    // Board revision incremented
    expect(t2.body.boardRevision).toBe(3); // init 1 + 2 tasks
  });

  it('rejects task assignment to non-member', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Strict Assignment Board' });
    const boardId = boardRes.body.board._id;

    // Try assigning to user2 who is not a member
    const res = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Invalid Assignee Task', assignee: user2Id, status: 'Todo' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Assignee must be an active member');
  });

  it('detects concurrency conflict (409) on stale board revision during move', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Concurrency Board' });
    const boardId = boardRes.body.board._id;

    const tRes = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Moveable Task', status: 'Todo' });
    const taskId = tRes.body.task._id;
    const currentRevision = tRes.body.boardRevision;

    // Move task with intentionally stale expectedBoardRevision
    const staleRevision = currentRevision - 1;
    const conflictRes = await request(app)
      .patch(`/api/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        destinationStatus: 'In Progress',
        destinationPosition: 0,
        expectedBoardRevision: staleRevision,
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.currentRevision).toBe(currentRevision);
    expect(conflictRes.body.error).toContain('Conflict: Board has been updated by another collaborator');
  });

  it('successfully moves task and updates positions when revision matches', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Valid Move Board' });
    const boardId = boardRes.body.board._id;

    const tRes = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Task to Advance', status: 'Todo' });
    const taskId = tRes.body.task._id;
    const currentRevision = tRes.body.boardRevision;

    const moveRes = await request(app)
      .patch(`/api/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        destinationStatus: 'In Progress',
        destinationPosition: 0,
        expectedBoardRevision: currentRevision,
      });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.task.status).toBe('In Progress');
    expect(moveRes.body.task.position).toBe(0);
    expect(moveRes.body.boardRevision).toBe(currentRevision + 1);
  });

  it('creates and lists comments on tasks', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Comments Board' });
    const boardId = boardRes.body.board._id;

    const tRes = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Commentable Task', status: 'Todo' });
    const taskId = tRes.body.task._id;

    const commentRes = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Looks great! Ready for review.' });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.comment.content).toBe('Looks great! Ready for review.');

    const listRes = await request(app)
      .get(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.comments.length).toBe(1);
    expect(listRes.body.comments[0].author.name).toBe('User One');
  });
});
