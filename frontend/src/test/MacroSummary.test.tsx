import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MacroSummary from '../components/MacroSummary';
import type { LogEntry } from '../types';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: '1',
    mealType: 'breakfast',
    foodName: 'Test food',
    quantityG: 100,
    calories: 100,
    proteinG: 10,
    carbsG: 20,
    fatG: 5,
    ...overrides,
  };
}

describe('MacroSummary', () => {
  it('shows zero totals when no entries', () => {
    render(<MacroSummary entries={[]} />);
    // All four macro values should display as 0
    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('Protein')).toBeInTheDocument();
  });

  it('sums calories from all entries', () => {
    const entries = [
      makeEntry({ calories: 100 }),
      makeEntry({ calories: 200, mealType: 'lunch' }),
    ];
    render(<MacroSummary entries={entries} />);
    // 300 kcal total
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('rounds macro totals to 1 decimal place', () => {
    const entries = [
      makeEntry({ proteinG: 10.15 }),
      makeEntry({ proteinG: 5.16 }),
    ];
    render(<MacroSummary entries={entries} />);
    // 10.15 + 5.16 = 15.31 → rounds to 15.3
    expect(screen.getByText('15.3')).toBeInTheDocument();
  });
});
