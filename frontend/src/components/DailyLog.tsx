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

const MEAL_META: Record<MealType, { icon: string; label: string; color: string }> = {
  breakfast: { icon: '🌅', label: 'Breakfast', color: 'text-orange-500' },
  lunch:     { icon: '☀️', label: 'Lunch',     color: 'text-yellow-600' },
  dinner:    { icon: '🌙', label: 'Dinner',    color: 'text-indigo-500' },
  snack:     { icon: '🍎', label: 'Snack',     color: 'text-green-600'  },
};

function round1(n: number) { return Math.round(n * 10) / 10; }

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default function DailyLog({ entries, date, onRefresh }: Props) {
  const [addingTo, setAddingTo] = useState<MealType | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemoving(id);
    try {
      await removeLogEntry(id);
      onRefresh();
    } finally {
      setRemoving(null);
    }
  }

  function entriesFor(meal: MealType) {
    return entries.filter((e) => e.mealType === meal);
  }

  return (
    <div className="space-y-3">
      {MEAL_TYPES.map((meal) => {
        const meta        = MEAL_META[meal];
        const mealEntries = entriesFor(meal);
        const mealKcal    = mealEntries.reduce((s, e) => s + e.calories, 0);

        return (
          <div key={meal} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Meal header */}
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl leading-none">{meta.icon}</span>
                <div>
                  <h3 className={`text-sm font-semibold ${meta.color}`}>{meta.label}</h3>
                  {mealEntries.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {round1(mealKcal)} kcal · {mealEntries.length} item{mealEntries.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setAddingTo(meal)}
                className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span className="text-sm leading-none">+</span> Add
              </button>
            </div>

            {/* Food rows */}
            {mealEntries.length === 0 ? (
              <p className="px-5 pb-4 text-xs text-gray-400">Nothing logged yet.</p>
            ) : (
              <ul className="border-t border-gray-50 divide-y divide-gray-50">
                {mealEntries.map((entry) => (
                  <li key={entry.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                        {entry.foodName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{entry.quantityG} g</p>
                      {/* Macro badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-xs font-medium border border-orange-100">
                          {round1(entry.calories)} kcal
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                          P {round1(entry.proteinG)}g
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100">
                          C {round1(entry.carbsG)}g
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 text-xs font-medium border border-red-100">
                          F {round1(entry.fatG)}g
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      disabled={removing === entry.id}
                      className="text-gray-300 hover:text-red-400 disabled:opacity-40 transition-colors flex-shrink-0 mt-0.5 p-1 rounded-lg hover:bg-red-50"
                      title="Remove"
                    >
                      {removing === entry.id
                        ? <span className="w-4 h-4 block border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        : <TrashIcon />
                      }
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
