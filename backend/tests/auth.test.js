import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Authentication & Admin API', () => {
  it('registers a new regular user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Developer',
        email: 'alice@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Alice Developer');
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.token).toBeDefined();

    // Verify cookie set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('kanban_token=');
  });

  it('rejects public registration privilege escalation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker Bob',
        email: 'hacker@example.com',
        password: 'Password123!',
        role: 'admin',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Privilege escalation rejected');
  });

  it('rejects duplicate user email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carol Doe',
        email: 'carol@example.com',
        password: 'Password123!',
      });

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carol Duplicate',
        email: 'carol@example.com',
        password: 'Password123!',
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error).toContain('already exists');
  });

  it('authenticates valid regular user login', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dave Smith',
        email: 'dave@example.com',
        password: 'Password123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dave@example.com',
        password: 'Password123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.email).toBe('dave@example.com');
  });

  it('rejects invalid password login', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Eve Tester',
        email: 'eve@example.com',
        password: 'Password123!',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'eve@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('authenticates admin login via environment credentials', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({
        adminId: 'test_admin_id',
        password: 'TestAdminPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.token).toBeDefined();
  });

  it('rejects invalid admin login credentials', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({
        adminId: 'test_admin_id',
        password: 'IncorrectAdminPassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects access to protected admin route by standard user', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Frank Regular',
        email: 'frank@example.com',
        password: 'Password123!',
      });

    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/admin/system-stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Administrative privileges required');
  });

  it('permits access to protected admin route with admin token', async () => {
    const adminRes = await request(app)
      .post('/api/auth/admin/login')
      .send({
        adminId: 'test_admin_id',
        password: 'TestAdminPassword123!',
      });

    const adminToken = adminRes.body.token;

    const res = await request(app)
      .get('/api/admin/system-stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.uptimeSeconds).toBeTypeOf('number');
  });

  it('logs out and revokes active token', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Grace Logouter',
        email: 'grace@example.com',
        password: 'Password123!',
      });

    const token = regRes.body.token;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);

    // Re-attempt using revoked token
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(401);
    expect(meRes.body.error).toContain('Invalid or revoked token');
  });
});
