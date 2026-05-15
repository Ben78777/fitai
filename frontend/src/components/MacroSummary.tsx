import type { LogEntry } from '../types';

interface Props {
  entries: LogEntry[];
  weightKg?: number; // when provided, recommendation notes are shown
  goal?: string;
}

interface MacroBar {
  label: string;
  value: number;
  unit: string;
  color: string;
  recNote?: string;
  recMet?: boolean; // true → green note, false → neutral gray
}

export default function MacroSummary({ entries, weightKg }: Props) {
  // Sum all macros across every meal entry for the day
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein:  acc.protein  + e.proteinG,
      carbs:    acc.carbs    + e.carbsG,
      fat:      acc.fat      + e.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const round = (n: number) => Math.round(n * 10) / 10;

  // Macro recommendations — only when weightKg is available
  let proteinRec: { note: string; met: boolean } | undefined;
  let carbsRec:   { note: string; met: boolean } | undefined;
  let fatRec:     { note: string; met: boolean } | undefined;

  if (weightKg && weightKg > 0) {
    const minP = Math.round(1.6 * weightKg);
    const maxP = Math.round(2.2 * weightKg);
    const minC = Math.round(3.0 * weightKg);
    const maxC = Math.round(5.0 * weightKg);
    const minF = Math.round(0.8 * weightKg);
    const maxF = Math.round(1.2 * weightKg);

    proteinRec = { note: `Recommended: ${minP}g – ${maxP}g/day for optimal muscle results`, met: totals.protein >= minP };
    carbsRec   = { note: `Recommended: ${minC}g – ${maxC}g/day for energy and performance`,  met: totals.carbs   >= minC };
    fatRec     = { note: `Recommended: ${minF}g – ${maxF}g/day for hormonal health`,          met: totals.fat     >= minF };
  }

  const bars: MacroBar[] = [
    { label: 'Calories', value: round(totals.calories), unit: 'kcal', color: 'bg-orange-400' },
    { label: 'Protein',  value: round(totals.protein),  unit: 'g',    color: 'bg-blue-400',   recNote: proteinRec?.note, recMet: proteinRec?.met },
    { label: 'Carbs',    value: round(totals.carbs),    unit: 'g',    color: 'bg-yellow-400', recNote: carbsRec?.note,   recMet: carbsRec?.met   },
    { label: 'Fat',      value: round(totals.fat),      unit: 'g',    color: 'bg-red-400',    recNote: fatRec?.note,     recMet: fatRec?.met     },
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
            {bar.recNote && (
              // Green when minimum is already met today, neutral gray otherwise
              <p className={`text-xs mt-1.5 leading-tight ${bar.recMet ? 'text-green-600' : 'text-gray-400'}`}>
                {bar.recNote}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
