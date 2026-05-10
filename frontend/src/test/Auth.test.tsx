import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Auth from '../components/Auth';

// Mock the Supabase client — we don't need real auth in unit tests
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('Auth', () => {
  it('renders the login tab by default', () => {
    render(<Auth />);
    // Both the tab and submit button say "Login" — confirm at least one is present
    expect(screen.getAllByText('Login').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('switches to register tab on click', () => {
    render(<Auth />);
    const registerTab = screen.getAllByText('Register')[0];
    fireEvent.click(registerTab);
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('shows email and password inputs', () => {
    render(<Auth />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });
});
