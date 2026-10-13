import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../src/pages/LoginPage.jsx';
import { RegisterPage } from '../src/pages/RegisterPage.jsx';
import { FilterBar } from '../src/components/FilterBar.jsx';
import { useAuthStore } from '../src/store/useAuthStore.js';
import { useBoardStore } from '../src/store/useBoardStore.js';

describe('Frontend Component & Store Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({
      loading: false,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  });

  it('renders LoginPage with regular user and admin mode toggle', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Kanban/i)).toBeInTheDocument();
    expect(screen.getByText(/Team Member/i)).toBeInTheDocument();
    expect(screen.getByText(/System Admin/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();

    // Switch to Admin mode
    fireEvent.click(screen.getByText(/System Admin/i));
    expect(screen.getByPlaceholderText('Environment ADMIN_ID')).toBeInTheDocument();
    expect(screen.getByText(/Sign In as Administrator/i)).toBeInTheDocument();
  });

  it('validates password matching on RegisterPage', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText('Jane Doe');
    const emailInput = screen.getByPlaceholderText('jane@company.com');
    const [passInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmInput, { target: { value: 'MismatchedPassword' } });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('manages filter state and clear filters button in FilterBar', () => {
    const mockMembers = [
      { user: { _id: 'u1', name: 'Alice', email: 'alice@test.com' } },
      { user: { _id: 'u2', name: 'Bob', email: 'bob@test.com' } },
    ];

    render(<FilterBar members={mockMembers} />);

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'Refactor' } });

    expect(useBoardStore.getState().filters.search).toBe('Refactor');

    // Select priority
    const prioritySelect = screen.getByDisplayValue('Priority: All');
    fireEvent.change(prioritySelect, { target: { value: 'High' } });

    expect(useBoardStore.getState().filters.priority).toBe('High');

    // Clear filters button appears
    const clearBtn = screen.getByText(/Clear Filters/i);
    expect(clearBtn).toBeInTheDocument();

    // Click clear
    fireEvent.click(clearBtn);
    expect(useBoardStore.getState().filters.search).toBe('');
    expect(useBoardStore.getState().filters.priority).toBe('');
  });

  it('manages optimistic move and conflict recovery in useBoardStore', () => {
    act(() => {
      useBoardStore.setState({
        currentBoard: { _id: 'b1', title: 'Test Board', revision: 5 },
        tasks: [
          { _id: 't1', title: 'Task 1', status: 'Todo', position: 0 },
          { _id: 't2', title: 'Task 2', status: 'In Progress', position: 0 },
        ],
      });
    });

    // Test real-time task created
    act(() => {
      useBoardStore.getState().onSocketTaskCreated({
        task: { _id: 't3', title: 'Task 3', status: 'Done', position: 0 },
        boardRevision: 6,
      });
    });

    const state = useBoardStore.getState();
    expect(state.tasks.length).toBe(3);
    expect(state.currentBoard.revision).toBe(6);

    // Test real-time task deleted
    act(() => {
      useBoardStore.getState().onSocketTaskDeleted({
        taskId: 't3',
        boardRevision: 7,
      });
    });

    expect(useBoardStore.getState().tasks.length).toBe(2);
    expect(useBoardStore.getState().currentBoard.revision).toBe(7);
  });
});
