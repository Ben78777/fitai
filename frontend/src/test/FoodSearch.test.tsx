import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FoodSearch from '../components/FoodSearch';

vi.mock('../lib/api', () => ({
  searchFood: vi.fn(),
  addLogEntry: vi.fn().mockResolvedValue({}),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
}));

import { searchFood } from '../lib/api';
const mockSearch = searchFood as ReturnType<typeof vi.fn>;

const mockResults = [
  { productName: 'Banana', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { productName: 'Apple',  caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
];

describe('FoodSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSearch.mockResolvedValue(mockResults);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the search input on open', () => {
    render(<FoodSearch mealType="breakfast" date="2026-05-10" onAdded={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('Type a food name to search…')).toBeInTheDocument();
  });

  it('shows results after typing once debounce fires', async () => {
    render(<FoodSearch mealType="breakfast" date="2026-05-10" onAdded={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a food name to search…');

    fireEvent.change(input, { target: { value: 'banana' } });

    // Advance timers and flush all pending promises inside act
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve(); // flush microtask queue
    });

    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('does not fire the API call before 400ms debounce elapses', async () => {
    render(<FoodSearch mealType="breakfast" date="2026-05-10" onAdded={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a food name to search…');

    fireEvent.change(input, { target: { value: 'ba' } });

    await act(async () => { vi.advanceTimersByTime(300); }); // not yet
    expect(mockSearch).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(100); // now 400ms total
      await Promise.resolve();
    });
    expect(mockSearch).toHaveBeenCalledWith('ba');
  });

  it('shows quantity panel after selecting a result', async () => {
    render(<FoodSearch mealType="lunch" date="2026-05-10" onAdded={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a food name to search…');

    fireEvent.change(input, { target: { value: 'banana' } });

    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    fireEvent.click(screen.getByText('Banana'));

    expect(screen.getByPlaceholderText('e.g. 150')).toBeInTheDocument();
    expect(screen.getByText('Add to log')).toBeInTheDocument();
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
