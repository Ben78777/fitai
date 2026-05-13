import { useState, useRef, useEffect } from 'react';
import { analyzeFood, addLogEntry } from '../lib/api';
import type { FoodAnalysisItem, MealType } from '../types';

interface Props {
  mealType: MealType;
  date: string;
  onAdded: () => void;
  onClose: () => void;
}

// Scale an item's macros when the user edits the quantity
function scaleItem(item: FoodAnalysisItem, newQty: number): FoodAnalysisItem {
  const scale = item.quantityG > 0 ? newQty / item.quantityG : 1;
  const r = (n: number) => Math.round(n * 10) / 10;
  return {
    foodName:  item.foodName,
    quantityG: newQty,
    calories:  r(item.calories  * scale),
    proteinG:  r(item.proteinG  * scale),
    carbsG:    r(item.carbsG    * scale),
    fatG:      r(item.fatG      * scale),
  };
}

export default function FoodSearch({ mealType, date, onAdded, onClose }: Props) {
  const [query,    setQuery]    = useState('');
  const [items,    setItems]    = useState<FoodAnalysisItem[]>([]);
  // edited quantities per row — stored as strings so the input stays responsive
  const [qtys,     setQtys]     = useState<string[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Analyze ────────────────────────────────────────────────────

  async function handleAnalyze() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true); setError(''); setItems([]); setQtys([]);
    try {
      const data = await analyzeFood(trimmed);
      setItems(data);
      setQtys(data.map((d) => String(d.quantityG)));
    } catch {
      setError('Analysis failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Log all items ──────────────────────────────────────────────

  async function handleLog() {
    setSaving(true); setError('');
    try {
      // Log each food item as a separate entry, respecting edited quantities
      for (let i = 0; i < items.length; i++) {
        const qty = parseFloat(qtys[i]);
        const scaled = scaleItem(items[i], isNaN(qty) || qty <= 0 ? items[i].quantityG : qty);
        await addLogEntry({
          date,
          mealType,
          foodName:  scaled.foodName,
          quantityG: scaled.quantityG,
          calories:  scaled.calories,
          proteinG:  scaled.proteinG,
          carbsG:    scaled.carbsG,
          fatG:      scaled.fatG,
        });
      }
      onAdded();
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Derived totals ─────────────────────────────────────────────

  const totals = items.reduce(
    (acc, item, i) => {
      const qty = parseFloat(qtys[i]);
      const s   = scaleItem(item, isNaN(qty) || qty <= 0 ? item.quantityG : qty);
      const r   = (n: number) => Math.round(n * 10) / 10;
      return {
        calories: r(acc.calories + s.calories),
        proteinG: r(acc.proteinG + s.proteinG),
        carbsG:   r(acc.carbsG   + s.carbsG),
        fatG:     r(acc.fatG     + s.fatG),
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 capitalize">
            Add food to {mealType}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleAnalyze()}
            placeholder="e.g. banana  •  200g chicken breast and 100g rice"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !query.trim()}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Analyzing…
              </span>
            ) : 'Analyze'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Empty state */}
        {!loading && items.length === 0 && !error && (
          <p className="text-center text-gray-400 text-sm py-8">
            Type any food or meal and press Analyze
          </p>
        )}

        {/* Results table */}
        {items.length > 0 && (
          <>
            <div className="rounded-lg border border-gray-200 overflow-hidden mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-left">
                    <th className="px-3 py-2 font-medium">Food</th>
                    <th className="px-2 py-2 font-medium text-right">g</th>
                    <th className="px-2 py-2 font-medium text-right text-orange-500">kcal</th>
                    <th className="px-2 py-2 font-medium text-right text-blue-500">Pro</th>
                    <th className="px-2 py-2 font-medium text-right text-yellow-600">Carb</th>
                    <th className="px-2 py-2 font-medium text-right text-red-400">Fat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => {
                    const qty = parseFloat(qtys[i]);
                    const s   = scaleItem(item, isNaN(qty) || qty <= 0 ? item.quantityG : qty);
                    return (
                      <tr key={i} className="text-gray-700">
                        <td className="px-3 py-2">{item.foodName}</td>
                        <td className="px-2 py-1.5 text-right">
                          {/* Editable quantity — macros rescale live */}
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={qtys[i]}
                            onChange={(e) => {
                              const next = [...qtys];
                              next[i] = e.target.value;
                              setQtys(next);
                            }}
                            className="w-16 text-right border border-gray-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-medium text-orange-500">{s.calories}</td>
                        <td className="px-2 py-2 text-right text-blue-500">{s.proteinG}g</td>
                        <td className="px-2 py-2 text-right text-yellow-600">{s.carbsG}g</td>
                        <td className="px-2 py-2 text-right text-red-400">{s.fatG}g</td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Total row — only shown for multiple items */}
                {items.length > 1 && (
                  <tfoot>
                    <tr className="bg-green-50 font-semibold text-gray-800 border-t-2 border-green-200">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-2 py-2" />
                      <td className="px-2 py-2 text-right text-orange-500">{totals.calories}</td>
                      <td className="px-2 py-2 text-right text-blue-500">{totals.proteinG}g</td>
                      <td className="px-2 py-2 text-right text-yellow-600">{totals.carbsG}g</td>
                      <td className="px-2 py-2 text-right text-red-400">{totals.fatG}g</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <button
              onClick={handleLog}
              disabled={saving}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {saving
                ? 'Saving…'
                : items.length > 1
                  ? `Log ${items.length} items (${totals.calories} kcal) to ${mealType}`
                  : `Log to ${mealType} (${totals.calories} kcal)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
