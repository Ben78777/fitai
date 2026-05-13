import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FoodSearch from '../components/FoodSearch';

vi.mock('../lib/api', () => ({
  analyzeFood: vi.fn(),
  addLogEntry: vi.fn().mockResolvedValue({}),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
}));

import { analyzeFood } from '../lib/api';
const mockAnalyze = analyzeFood as ReturnType<typeof vi.fn>;

const mockResults = [
  { foodName: 'Banana',  quantityG: 100, calories: 89,  proteinG: 1.1, carbsG: 23,   fatG: 0.3 },
  { foodName: 'Chicken', quantityG: 200, calories: 330, proteinG: 62,  carbsG: 0,    fatG: 7.2 },
];

describe('FoodSearch', () => {
  beforeEach(() => {
    mockAnalyze.mockResolvedValue(mockResults);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input on open', () => {
    render(<FoodSearch mealType="breakfast" date="2026-05-10" onAdded={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
  });

  it('shows results after clicking Analyze', async () => {
    render(<FoodSearch mealType="breakfast" date="2026-05-10" onAdded={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'banana' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Analyze'));
      await Promise.resolve();
    });

    expect(mockAnalyze).toHaveBeenCalledWith('banana');
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Chicken')).toBeInTheDocument();
  });

  it('shows a Log button after results load', async () => {
    render(<FoodSearch mealType="lunch" date="2026-05-10" onAdded={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'meal' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Analyze'));
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: /log/i })).toBeInTheDocument();
  });

  it('shows empty state prompt before any search', () => {
    render(<FoodSearch mealType="dinner" date="2026-05-10" onAdded={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Type any food or meal/i)).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <FoodSearch mealType="dinner" date="2026-05-10" onAdded={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });
});
