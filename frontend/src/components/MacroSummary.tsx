import type { LogEntry } from '../types';

interface Props {
  entries: LogEntry[];
}

interface MacroBar {
  label: string;
  value: number;
  unit: string;
  color: string;
}

export default function MacroSummary({ entries }: Props) {
  // Sum all macros across every meal entry for the day
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.proteinG,
      carbs: acc.carbs + e.carbsG,
      fat: acc.fat + e.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const round = (n: number) => Math.round(n * 10) / 10;

  const bars: MacroBar[] = [
    { label: 'Calories', value: round(totals.calories), unit: 'kcal', color: 'bg-orange-400' },
    { label: 'Protein',  value: round(totals.protein),  unit: 'g',    color: 'bg-blue-400' },
    { label: 'Carbs',    value: round(totals.carbs),    unit: 'g',    color: 'bg-yellow-400' },
    { label: 'Fat',      value: round(totals.fat),      unit: 'g',    color: 'bg-red-400' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Today's Macros</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {bars.map((bar) => (
          <div key={bar.label} className="text-center">
            <div className={`${bar.color} h-2 rounded-full mb-2`} />
            <p className="text-xl font-bold text-gray-900">
              {bar.value}
              <span className="text-sm font-normal text-gray-500 ml-1">{bar.unit}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{bar.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
