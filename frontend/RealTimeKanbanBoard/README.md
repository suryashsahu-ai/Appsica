# Real-Time Collaborative Kanban Board

A high-performance, real-time collaborative task management system built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO. Engineered with server-authoritative mutations, Optimistic Concurrency Control (OCC), deterministic task ordering, multi-tenant board isolation, and environment-configured administrative privileges.

---

## 1. Project Overview & Actual Features

### Core Capabilities
- **Real-Time Collaboration:** Instant bidirectional task movement, addition, updates, deletions, and presence signals synchronized across active browser sessions using Socket.IO rooms.
- **Server-Authoritative Mutations with OCC:** Client mutations submit the expected board revision. If concurrent edits have modified the board, the server rejects stale updates with `409 Conflict`, prompting client rollback and automatic canonical state reconciliation.
- **Deterministic Column Ordering:** Zero gaps and collision-free integer position indexing (`0, 1, 2, ...`) across cross-column transfers and in-column reordering.
- **Strict Role-Based Authorization:** Complete isolation of board workspaces. Uninvited users and administrative tokens are blocked from private board operations (`403 Forbidden`).
- **Environment-Configured Administrator:** Dedicated administrative login endpoint (`POST /api/auth/admin/login`) authenticated strictly against backend environment variables (`ADMIN_ID` & `ADMIN_PASSWORD`) using constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
- **Multi-Tab Online Presence:** Real-time presence indicator showing online collaborators with per-user socket connection tracking. A user only appears offline once all active tabs/connections are closed.
- **Typing Indicators:** Real-time signals broadcast to room members when a collaborator edits a card, with auto-expiring timeouts on idle or disconnect.
- **Combinable Filters:** Multi-criteria filtering by priority (`Low`, `Medium`, `High`), assigned member, due date (`overdue`, `today`, `upcoming`), and keyword search with an instant clear-filters action.
- **Activity Feed & Audit:** Chronological committed action history tracking task creation, movements, edits, deletions, and member invitations.
- **Task Comments:** Task-specific discussion threads with real-time delivery and author-verified deletion.
- **Live Board Analytics:** Computed board metrics including completion rates, status distribution, priority breakdown, and overdue task counters.

---

## 2. Architecture & Folder Structure

```
RealTimeKanbanBoard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActivityDrawer.jsx
│   │   │   ├── AnalyticsModal.jsx
│   │   │   ├── Column.jsx
│   │   │   ├── ConflictToast.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── InviteMemberModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   └── TaskModal.jsx
│   │   ├── pages/
│   │   │   ├── AdminPage.jsx
│   │   │   ├── BoardPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── hooks/
│   │   │   └── useSocket.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   └── boardService.js
│   │   ├── store/
│   │   │   ├── useAuthStore.js
│   │   │   └── useBoardStore.js
│   │   ├── socket/
│   │   │   └── socket.js
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tests/
│   │   ├── app.test.jsx
│   │   └── setup.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── eslint.config.js
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── Activity.js
│   │   │   ├── Board.js
│   │   │   ├── Comment.js
│   │   │   ├── Task.js
│   │   │   └── User.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── boardController.js
│   │   │   ├── commentController.js
│   │   │   └── taskController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── boardAuth.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── boardRoutes.js
│   │   │   ├── commentRoutes.js
│   │   │   └── taskRoutes.js
│   │   ├── services/
│   │   │   ├── boardService.js
│   │   │   ├── commentService.js
│   │   │   └── taskService.js
│   │   ├── sockets/
│   │   │   └── socketHandler.js
│   │   ├── validators/
│   │   │   ├── authValidators.js
│   │   │   ├── boardValidators.js
│   │   │   └── taskValidators.js
│   │   ├── utils/
│   │   │   └── token.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── board_and_task.test.js
│   │   └── setup.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   ├── vitest.config.js
│   └── eslint.config.js
├── .gitignore
└── README.md
```

---

## 3. Technology Stack & Prerequisites

- **Node.js:** v18 LTS, v20 LTS, or v24 (Tested and verified with Node v24.8.0 and npm 11.6.0)
- **Database:** MongoDB 6.0+ (Local standalone service or MongoDB Atlas cluster)
- **Backend Framework:** Express 4.x with ES Modules (`"type": "module"`)
- **Database ODM:** Mongoose 8.x
- **Real-Time Layer:** Socket.IO 4.x
- **Security:** Helmet, CORS (credentialed explicit origins), bcryptjs, jsonwebtoken, express-rate-limit
- **Frontend Framework:** React 18 with Vite
- **Styling:** Tailwind CSS 3.4 with PostCSS & Autoprefixer
- **Drag-and-Drop:** `@hello-pangea/dnd` (maintained, collision-safe successor to react-beautiful-dnd)
- **Client State:** Zustand 5.x
- **HTTP Client:** Axios 1.7
- **Testing:** Vitest 3.x, Supertest, Testing Library React, jsdom

---

## 4. Environment Configuration & Setup

### MongoDB Setup & Transaction Support Requirements
- The application automatically connects via Mongoose using `MONGODB_URI`.
- On connection, the server inspects the MongoDB deployment topology:
  - If a **Replica Set** or **MongoDB Atlas cluster** is present, multi-document ACID transactions are active.
  - If a **Standalone** instance is running (such as a default local Windows MongoDB service), operations execute with atomic single-document updates and OCC revision guards.

### Configuring Backend Environment (`backend/.env`)
Create `backend/.env` by copying `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Required | Example Default |
|---|---|---|---|
| `PORT` | HTTP server port | Optional | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | Optional | `development` |
| `CLIENT_URL` | Allowed frontend origin for CORS and Socket.IO | Required | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection URI | Required | `mongodb://localhost:27017/kanban_board` |
| `JWT_SECRET` | Secret key for signing JWTs (min 16 chars) | Required | `super_secret_jwt_key_change_in_production_min_32_chars` |
| `JWT_EXPIRES_IN` | Token expiration duration | Optional | `15m` |
| `ADMIN_ID` | Master administrator login ID | Required | `admin_kanban` |
| `ADMIN_PASSWORD` | Master administrator password | Required | `ChangeThisSecureAdminPassword123!` |

*Note: Required variables are validated at server bootstrap. If any required key is missing, startup safely halts with a clear configuration message.*

### Configuring Frontend Environment (`frontend/.env`)
Create `frontend/.env` by copying `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description | Required | Default |
|---|---|---|---|
| `VITE_API_URL` | Base API URL prefix for backend REST communication | Required | `http://localhost:5000/api` |

---

## 5. Authentication, JWT, and Admin Security

### 5.1 Regular Users
- Registered through `POST /api/auth/register`. Public registration strictly assigns the `user` role; any client attempt to supply `role: "admin"` is rejected with `400 Bad Request`.
- Password hashes are computed using `bcryptjs` with salt rounds. Hashes are excluded from all API responses via `select: false` and custom Mongoose serialization transforms.
- Authenticated via `POST /api/auth/login`. Issues a signed JWT stored in an HttpOnly cookie (`kanban_token`) with `SameSite=Lax/Strict` and `Secure` in production, and simultaneously returned in the JSON payload for clients using `Authorization: Bearer <token>`.
- Token revocation is enforced on `POST /api/auth/logout` via a cryptographic token identifier (`jti`) revocation registry.

### 5.2 Environment-Configured Administrator
- Authenticated exclusively through `POST /api/auth/admin/login`.
- Input credentials are verified against `process.env.ADMIN_ID` and `process.env.ADMIN_PASSWORD` using constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
- Issues an administrative JWT with claims `{ userId: 'admin', role: 'admin', tokenType: 'admin' }`.
- Administrative operations are protected by `authenticateJWT` and `requireAdmin` middleware.
- **Privilege Separation:** Admin tokens cannot view, join, or mutate private boards without explicit board membership. Normal board operations reject administrative tokens with `403 Forbidden`.

---

## 6. REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new standard user account.
- `POST /api/auth/login` — Sign in as a regular user.
- `POST /api/auth/admin/login` — Sign in with environment administrator credentials.
- `POST /api/auth/logout` — Revoke token and clear session cookie.
- `GET /api/auth/me` — Retrieve active session profile.

### Boards & Members
- `GET /api/boards` — List all boards accessible to authenticated user.
- `POST /api/boards` — Create a new board (creator automatically becomes owner).
- `GET /api/boards/:boardId` — Fetch board details and all column tasks.
- `PATCH /api/boards/:boardId` — Edit title/description (board owner/admin only).
- `POST /api/boards/:boardId/members` — Invite existing user by email (owner/admin only).
- `DELETE /api/boards/:boardId/members/:userId` — Remove board member (owner/admin only).
- `GET /api/boards/:boardId/activity` — Retrieve paginated board action feed.
- `GET /api/boards/:boardId/analytics` — Compute live board statistics.

### Tasks
- `GET /api/boards/:boardId/tasks` — List tasks with combinable query filters (`priority`, `assignee`, `status`, `due`).
- `POST /api/boards/:boardId/tasks` — Create new task in column.
- `GET /api/tasks/:taskId` — Retrieve task details.
- `PATCH /api/tasks/:taskId` — Update task title, description, priority, assignee, due date.
- `PATCH /api/tasks/:taskId/move` — Move task between/within columns with OCC `expectedBoardRevision`.
- `DELETE /api/tasks/:taskId` — Delete task and re-normalize remaining column positions.

### Comments
- `GET /api/tasks/:taskId/comments` — List comments for a task.
- `POST /api/tasks/:taskId/comments` — Post a new comment on a task.
- `DELETE /api/comments/:commentId` — Delete comment (author or board owner/admin).

### System Administration
- `GET /api/admin/system-stats` — System uptime, user counts, board counts, task counts.
- `GET /api/admin/users` — List registered users and status.
- `PATCH /api/admin/users/:userId/status` — Activate or deactivate user access.

---

## 7. Socket.IO Real-Time Architecture

### Authoritative Mutation Flow
1. **Mutation Submission:** Client submits state change to the REST API with authentication credentials and expected board revision.
2. **Server Verification:** Backend authenticates the request, verifies board membership, checks input validity, and evaluates OCC revision match.
3. **Database Commit:** Database writes are committed to MongoDB.
4. **WebSocket Broadcast:** After successful commit, the server broadcasts confirmed changes to room `board_${boardId}`.
5. **Client Reconciliation:** Connected clients receive the confirmed event and update local state deterministically.

### Implemented Socket Events
| Event Name | Direction | Payload Schema | Purpose |
|---|---|---|---|
| `board:join` | Client → Server | `{ boardId: string }` | Authenticated room subscription & presence |
| `board:leave` | Client → Server | `{ boardId: string }` | Leave board room & update presence |
| `task:typing:start` | Client → Server | `{ boardId, taskId }` | Broadcast typing indicator |
| `task:typing:stop` | Client → Server | `{ boardId, taskId }` | Clear typing indicator |
| `presence:updated` | Server → Client | `{ boardId, onlineUsers: [] }` | Active online collaborator roster |
| `task:created` | Server → Client | `{ task, boardRevision }` | New task added |
| `task:updated` | Server → Client | `{ task, boardRevision }` | Task details modified |
| `task:moved` | Server → Client | `{ task, fromStatus, toStatus, boardRevision }` | Task moved or reordered |
| `task:deleted` | Server → Client | `{ taskId, status, boardRevision }` | Task removed |
| `task:typing` | Server → Client | `{ boardId, taskId, userName, isTyping }` | Collaborative typing display |
| `activity:created` | Server → Client | `{ activity }` | Real-time audit timeline event |

---

## 8. Concurrency, Ordering & Reconnection Strategy

### Optimistic Concurrency Control (OCC)
- Every board maintains an incremental integer `revision` counter.
- When moving a task, the client passes `expectedBoardRevision`.
- If another user submitted a move in the interim, the server rejects the request with HTTP `409 Conflict`:
  ```json
  {
    "success": false,
    "error": "Conflict: Board has been updated by another collaborator. Refreshing latest state.",
    "currentRevision": 12
  }
  ```
- The frontend captures `409 Conflict`, rolls back any optimistic drag state, displays a dismissible conflict notification, and pulls canonical board state.

### Reconnection Handling
When a client experiences temporary network disconnect:
1. Socket automatically attempts reconnection with exponential backoff.
2. On `connect`, it transmits the session token in the handshake.
3. Re-joins authorized board rooms (`board:join`).
4. Re-fetches canonical board details via REST (`GET /api/boards/:boardId`) to reconcile any updates missed during the offline window.

---

## 9. Quality Verification & Verification Passes

### PASS 1 — Structural and Static Audit
- Verified directory layout, import/export specifier consistency across backend and frontend ES modules.
- Environment variables validated at startup; no hardcoded credentials or JWT secrets.
- Checked Mongoose compound indexes: `{ board: 1, status: 1, position: 1 }` and `{ 'members.user': 1 }`.
- Verified ESLint configuration across backend and frontend (`0 errors, 0 warnings`).

### PASS 2 — Automated Test Execution
- **Backend Test Suite:** Executed with Vitest against an isolated test database `mongodb://127.0.0.1:27017/kanban_test_suite`.
  - Auth test suite: 10/10 passed (Registration, privilege escalation prevention, duplicate handling, login, admin auth, route protection, token revocation).
  - Board & Task test suite: 9/9 passed (Board creation, owner assignment, non-member rejection, admin private board isolation, task ordering, non-member assignment rejection, 409 OCC conflict detection, valid move, comments).
- **Frontend Test Suite:** Executed with Vitest, jsdom, and Testing Library.
  - 4/4 passed (Login mode switcher, registration password validation, filter bar state/clear, store optimistic move and conflict recovery).
- **Frontend Production Build:** Built with Vite (`npm run build`). Generated clean bundles in `dist/`.

### PASS 3 — Security & Edge-Case Verification
- Constant-time string comparison verified on admin login.
- Public registration escalation attempts confirmed rejected (`role: 'admin'` -> `400`).
- Cross-board isolation verified: members of Board A cannot access Board B.
- Multi-tab presence verified: disconnecting one tab preserves online indicator if another tab remains active.
- OCC 409 conflict tested and confirmed working.

---

## 10. Two-Browser Manual Real-Time Test Plan

Follow these steps to manually verify real-time collaboration across two distinct browser sessions:

1. **Open Two Independent Browsers:** Open Browser 1 (e.g. Chrome) and Browser 2 (e.g. Chrome Incognito or Firefox).
2. **Register Two Accounts:**
   - In Browser 1, register as `User A` (`usera@test.com`).
   - In Browser 2, register as `User B` (`userb@test.com`).
3. **Create Board:** In Browser 1, click **Create New Board** titled "Sprint 1".
4. **Invite User B:**
   - In Browser 1, click **Invite** on the board toolbar.
   - Enter `userb@test.com` and submit.
5. **Open Board in Both Browsers:** In Browser 2, navigate to the Dashboard and open "Sprint 1".
6. **Verify Presence:** Confirm that both Browser 1 and Browser 2 display the online collaborator avatar with a green indicator in the top navbar.
7. **Task Movement Synchronization:**
   - In Browser 1, create a task "Build Authentication" in `To Do`.
   - Confirm the task immediately renders in Browser 2 without page refresh.
   - In Browser 1, drag "Build Authentication" from `To Do` to `In Progress`.
   - Confirm the card moves to `In Progress` in Browser 2 in real time.
8. **Verify Typing Indicators:**
   - In Browser 1, click the task card to edit its title.
   - Notice that Browser 2 displays "User A is editing..." on the card.
9. **Simulate Concurrent Move Conflict:**
   - Disconnect Browser 2 from the network or delay its request while Browser 1 moves a task (incrementing board revision).
   - Attempt an outdated move in Browser 2.
   - Confirm Browser 2 receives a `409 Conflict` notice, rolls back the move, and synchronizes to the latest persisted state.
10. **Verify Multi-Tab Presence:**
    - In Browser 2, open a second tab to the same board.
    - Close the second tab. Confirm Browser 1 still shows User B as online.
    - Close the final tab for User B. Confirm User B's presence indicator disappears in Browser 1.

---

## 11. Known Limitations & Notes

- **MongoDB Deployment Mode:** When running against a single standalone MongoDB instance (default Windows local service), multi-document transactions fall back safely to atomic document updates with OCC revision checks. For full multi-document ACID transactions, point `MONGODB_URI` to a replica set or MongoDB Atlas URI.
- **File Attachments:** Optional file attachment upload storage was omitted in favor of core architectural robustness, data integrity, and real-time reliability.

---

## Quick Start: Terminal Commands

Run the backend and frontend in separate terminals during development.

### Backend Terminal

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example` and enter your own values. Do not commit the actual `.env` file.

```bash
# Start backend in development mode (with auto-reload)
npm run dev

# Run backend automated tests
npm test

# Run backend linter
npm run lint

# Start backend in production mode
npm start
```

### Frontend Terminal

```bash
cd frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example` if pointing to a non-default API endpoint.

```bash
# Start frontend development server (Vite on http://localhost:5173)
npm run dev

# Run frontend automated tests
npm test

# Run frontend linter
npm run lint

# Build frontend for production
npm run build
```
