import { useState } from 'react';
import { removeLogEntry } from '../lib/api';
import FoodSearch from './FoodSearch';
import type { LogEntry, MealType } from '../types';

interface Props {
  entries: LogEntry[];
  date: string;
  onRefresh: () => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function DailyLog({ entries, date, onRefresh }: Props) {
  const [addingTo, setAddingTo] = useState<MealType | null>(null);

  async function handleRemove(id: string) {
    await removeLogEntry(id);
    onRefresh();
  }

  function entriesFor(meal: MealType) {
    return entries.filter((e) => e.mealType === meal);
  }

  return (
    <div className="space-y-4">
      {MEAL_TYPES.map((meal) => {
        const mealEntries = entriesFor(meal);
        const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);

        return (
          <div key={meal} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Meal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 capitalize">{meal}</h3>
                {mealEntries.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Math.round(mealCalories * 10) / 10} kcal
                  </p>
                )}
              </div>
              <button
                onClick={() => setAddingTo(meal)}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                + Add food
              </button>
            </div>

            {/* Food rows */}
            {mealEntries.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Nothing logged yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {mealEntries.map((entry) => (
                  <li key={entry.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{entry.foodName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.quantityG}g ·{' '}
                        <span className="text-orange-500">{Math.round(entry.calories * 10) / 10} kcal</span>
                        {' · '}
                        <span className="text-blue-500">{Math.round(entry.proteinG * 10) / 10}g P</span>
                        {' · '}
                        <span className="text-yellow-500">{Math.round(entry.carbsG * 10) / 10}g C</span>
                        {' · '}
                        <span className="text-red-400">{Math.round(entry.fatG * 10) / 10}g F</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
                      title="Remove"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {/* Food search modal */}
      {addingTo && (
        <FoodSearch
          mealType={addingTo}
          date={date}
          onAdded={onRefresh}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  );
}
