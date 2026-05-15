import { useState } from 'react';
import type { LogEntry } from '../types';

interface Props {
  entries: LogEntry[];
  weightKg?: number;
  goal?: string;
  dailyCalorieTarget?: number;
}

// Recommended daily values for micronutrients (used for comparison notes)
const MICRO_RDV = {
  fiberG:     { min: 25,   max: 38,   unit: 'g',   label: 'Fiber',      note: '25–38 g/day' },
  sugarG:     { min: 0,    max: 50,   unit: 'g',   label: 'Sugar',      note: 'under 50 g/day' },
  sodiumMg:   { min: 0,    max: 2300, unit: 'mg',  label: 'Sodium',     note: 'under 2,300 mg/day' },
  potassiumMg:{ min: 3500, max: 4700, unit: 'mg',  label: 'Potassium',  note: '3,500–4,700 mg/day' },
  vitaminCMg: { min: 65,   max: 90,   unit: 'mg',  label: 'Vitamin C',  note: '65–90 mg/day' },
  vitaminDMcg:{ min: 15,   max: 20,   unit: 'mcg', label: 'Vitamin D',  note: '15–20 mcg/day' },
  calciumMg:  { min: 1000, max: 1300, unit: 'mg',  label: 'Calcium',    note: '1,000–1,300 mg/day' },
  ironMg:     { min: 8,    max: 18,   unit: 'mg',  label: 'Iron',       note: '8–18 mg/day' },
} as const;

type MicroKey = keyof typeof MICRO_RDV;

function round1(n: number) { return Math.round(n * 10) / 10; }

// Progress bar: green < 80%, yellow 80–100%, red over 100%
function MacroBar({ value, max, color }: { value: number; max: number; color: string }) {
  if (max <= 0) return null;
  const pct = Math.min((value / max) * 100, 100);
  const barCls = pct >= 100 ? 'bg-red-400' : pct >= 80 ? 'bg-yellow-400' : color;
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
      <div className={`h-full rounded-full transition-all duration-500 ${barCls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function MacroSummary({ entries, weightKg, goal: _goal, dailyCalorieTarget }: Props) {
  const [microOpen, setMicroOpen] = useState(false);

  // ── Macro totals ──────────────────────────────────────────────────────────
  const totals = entries.reduce(
    (acc, e) => ({
      calories:    acc.calories    + e.calories,
      protein:     acc.protein     + e.proteinG,
      carbs:       acc.carbs       + e.carbsG,
      fat:         acc.fat         + e.fatG,
      fiberG:      acc.fiberG      + (e.fiberG      ?? 0),
      sugarG:      acc.sugarG      + (e.sugarG      ?? 0),
      sodiumMg:    acc.sodiumMg    + (e.sodiumMg    ?? 0),
      potassiumMg: acc.potassiumMg + (e.potassiumMg ?? 0),
      vitaminCMg:  acc.vitaminCMg  + (e.vitaminCMg  ?? 0),
      vitaminDMcg: acc.vitaminDMcg + (e.vitaminDMcg ?? 0),
      calciumMg:   acc.calciumMg   + (e.calciumMg   ?? 0),
      ironMg:      acc.ironMg      + (e.ironMg      ?? 0),
    }),
    {
      calories: 0, protein: 0, carbs: 0, fat: 0,
      fiberG: 0, sugarG: 0, sodiumMg: 0, potassiumMg: 0,
      vitaminCMg: 0, vitaminDMcg: 0, calciumMg: 0, ironMg: 0,
    }
  );

  // Whether any entries have micronutrient data at all
  const hasMicroData = entries.some(e =>
    e.fiberG != null || e.sodiumMg != null || e.vitaminCMg != null
  );

  // ── Macro targets from body weight ───────────────────────────────────────
  let maxP = 0, maxC = 0, maxF = 0;
  let minP = 0, minC = 0, minF = 0;
  if (weightKg && weightKg > 0) {
    minP = Math.round(1.6 * weightKg); maxP = Math.round(2.2 * weightKg);
    minC = Math.round(3.0 * weightKg); maxC = Math.round(5.0 * weightKg);
    minF = Math.round(0.8 * weightKg); maxF = Math.round(1.2 * weightKg);
  }

  const macros = [
    {
      label: 'Calories', value: round1(totals.calories), unit: 'kcal',
      color: 'bg-orange-400', textColor: 'text-orange-500',
      max: dailyCalorieTarget ?? 0,
      rec: null,
    },
    {
      label: 'Protein', value: round1(totals.protein), unit: 'g',
      color: 'bg-blue-400', textColor: 'text-blue-500',
      max: maxP,
      rec: maxP > 0 ? { note: `${minP}–${maxP} g/day`, met: totals.protein >= minP } : null,
    },
    {
      label: 'Carbs', value: round1(totals.carbs), unit: 'g',
      color: 'bg-yellow-400', textColor: 'text-yellow-600',
      max: maxC,
      rec: maxC > 0 ? { note: `${minC}–${maxC} g/day`, met: totals.carbs >= minC } : null,
    },
    {
      label: 'Fat', value: round1(totals.fat), unit: 'g',
      color: 'bg-red-400', textColor: 'text-red-500',
      max: maxF,
      rec: maxF > 0 ? { note: `${minF}–${maxF} g/day`, met: totals.fat >= minF } : null,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Today's Macros</h2>

      {/* ── 4 macro cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {macros.map((m) => (
          <div key={m.label}>
            <p className={`text-xl font-bold text-gray-900`}>
              {m.value.toLocaleString()}
              <span className="text-xs font-normal text-gray-400 ml-1">{m.unit}</span>
            </p>
            <p className="text-xs text-gray-500">{m.label}</p>
            {m.max > 0 && (
              <MacroBar value={m.value} max={m.max} color={m.color} />
            )}
            {m.rec && (
              <p className={`text-xs mt-1 leading-tight ${m.rec.met ? 'text-green-600' : 'text-gray-400'}`}>
                {m.rec.note}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Micronutrients collapsible ── */}
      {hasMicroData && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setMicroOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${microOpen ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Micronutrients
          </button>

          {microOpen && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
              {(Object.keys(MICRO_RDV) as MicroKey[]).map((key) => {
                const rdv = MICRO_RDV[key];
                const val = round1(totals[key]);
                // Color the value: green if in range, red if over max
                const valColor = val > rdv.max
                  ? 'text-red-500'
                  : key === 'sugarG' || key === 'sodiumMg'
                    ? val > rdv.max * 0.8 ? 'text-yellow-600' : 'text-gray-900'
                    : val >= rdv.min ? 'text-green-600' : 'text-gray-900';

                return (
                  <div key={key}>
                    <p className={`text-sm font-semibold ${valColor}`}>
                      {val}
                      <span className="text-xs font-normal text-gray-400 ml-1">{rdv.unit}</span>
                    </p>
                    <p className="text-xs text-gray-500">{rdv.label}</p>
                    <p className="text-xs text-gray-400 leading-tight mt-0.5">{rdv.note}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
