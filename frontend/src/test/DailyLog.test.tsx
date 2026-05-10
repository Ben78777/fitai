import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DailyLog from '../components/DailyLog';
import type { LogEntry } from '../types';

// Prevent FoodSearch modal from needing Supabase
vi.mock('../lib/api', () => ({
  removeLogEntry: vi.fn().mockResolvedValue(undefined),
  addLogEntry: vi.fn().mockResolvedValue({}),
  searchFood: vi.fn().mockResolvedValue([]),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
}));

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: '1',
    mealType: 'breakfast',
    foodName: 'Banana',
    quantityG: 120,
    calories: 106.8,
    proteinG: 1.3,
    carbsG: 27.6,
    fatG: 0.4,
    ...overrides,
  };
}

describe('DailyLog', () => {
  it('renders all four meal sections', () => {
    render(<DailyLog entries={[]} date="2026-05-10" onRefresh={vi.fn()} />);
    expect(screen.getByText('breakfast')).toBeInTheDocument();
    expect(screen.getByText('lunch')).toBeInTheDocument();
    expect(screen.getByText('dinner')).toBeInTheDocument();
    expect(screen.getByText('snack')).toBeInTheDocument();
  });

  it('shows food name and macros for a logged entry', () => {
    render(<DailyLog entries={[makeEntry()]} date="2026-05-10" onRefresh={vi.fn()} />);
    expect(screen.getByText('Banana')).toBeInTheDocument();
    // 106.8 appears in both the meal header total and the food row span
    expect(screen.getAllByText(/106\.8/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no entries for a meal', () => {
    render(<DailyLog entries={[]} date="2026-05-10" onRefresh={vi.fn()} />);
    const emptyMessages = screen.getAllByText('Nothing logged yet.');
    expect(emptyMessages).toHaveLength(4);
  });
});
