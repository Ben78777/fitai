import { useState, useEffect, useRef } from 'react';
import { searchFood, addLogEntry } from '../lib/api';
import type { FoodSearchResult, MealType } from '../types';

interface Props {
  mealType: MealType;
  date: string;
  onAdded: () => void;
  onClose: () => void;
}

type Mode = 'search' | 'freetext';

// Recover actual macros for one API item using its real serving size
function itemActualMacros(item: FoodSearchResult) {
  const factor = item.servingSizeG / 100;
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: round(item.caloriesPer100g * factor),
    proteinG: round(item.proteinPer100g * factor),
    carbsG:   round(item.carbsPer100g   * factor),
    fatG:     round(item.fatPer100g     * factor),
  };
}

// Scale per-100g macros by a user-entered gram amount (Mode 1)
function calcMacros(food: FoodSearchResult, grams: number) {
  const factor = grams / 100;
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: round(food.caloriesPer100g * factor),
    proteinG: round(food.proteinPer100g * factor),
    carbsG:   round(food.carbsPer100g   * factor),
    fatG:     round(food.fatPer100g     * factor),
  };
}

export default function FoodSearch({ mealType, date, onAdded, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('search');

  // ── Mode 1 (Search) state ──────────────────────────────────────
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<FoodSearchResult[]>([]);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // ── Mode 2 (Free Text) state ───────────────────────────────────
  const [ftQuery, setFtQuery]     = useState('');
  const [ftResults, setFtResults] = useState<FoodSearchResult[]>([]);
  const [ftHasSearched, setFtHasSearched] = useState(false);

  // ── Shared state ───────────────────────────────────────────────
  const [searching, setSearching] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Auto-focus on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounced search — Mode 1
  useEffect(() => {
    if (mode !== 'search') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) { setResults([]); setHasSearched(false); setError(''); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true); setError(''); setSelected(null);
      try {
        const data = await searchFood(trimmed);
        setResults(data);
        setHasSearched(true);
        if (data.length === 0) setError('No results found. Try a different term.');
      } catch { setError('Search failed. Check your connection.'); }
      finally { setSearching(false); }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mode]);

  // Debounced search — Mode 2
  useEffect(() => {
    if (mode !== 'freetext') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = ftQuery.trim();
    if (!trimmed) { setFtResults([]); setFtHasSearched(false); setError(''); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true); setError('');
      try {
        const data = await searchFood(trimmed);
        setFtResults(data);
        setFtHasSearched(true);
        if (data.length === 0) setError('No foods recognised. Try rephrasing.');
      } catch { setError('Search failed. Check your connection.'); }
      finally { setSearching(false); }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [ftQuery, mode]);

  // Sum all free-text results into one total
  const ftTotals = ftResults.reduce(
    (acc, item) => {
      const m = itemActualMacros(item);
      return {
        calories: Math.round((acc.calories + m.calories) * 10) / 10,
        proteinG: Math.round((acc.proteinG + m.proteinG) * 10) / 10,
        carbsG:   Math.round((acc.carbsG   + m.carbsG)   * 10) / 10,
        fatG:     Math.round((acc.fatG     + m.fatG)      * 10) / 10,
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  // ── Add handlers ───────────────────────────────────────────────

  async function handleAdd() {
    if (!selected || !quantity) return;
    const grams = parseFloat(quantity);
    if (isNaN(grams) || grams <= 0) { setError('Enter a valid quantity in grams.'); return; }
    setSaving(true); setError('');
    try {
      const macros = calcMacros(selected, grams);
      await addLogEntry({ date, mealType, foodName: selected.productName, quantityG: grams, ...macros });
      onAdded(); onClose();
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  }

  async function handleFtAdd() {
    if (ftResults.length === 0) return;
    setSaving(true); setError('');
    try {
      // Log the full query as the food name; quantity is the total grams parsed by the API
      const totalG = Math.round(ftResults.reduce((s, i) => s + i.servingSizeG, 0) * 10) / 10;
      await addLogEntry({
        date, mealType,
        foodName: ftQuery.trim(),
        quantityG: totalG,
        ...ftTotals,
      });
      onAdded(); onClose();
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  }

  // Switch mode — reset everything for the other mode
  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setSearching(false);
    if (next === 'search') {
      setFtResults([]); setFtHasSearched(false);
    } else {
      setResults([]); setSelected(null); setQuantity(''); setHasSearched(false);
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  }

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

        {/* Mode tabs */}
        <div className="flex rounded-lg border border-gray-200 mb-4 overflow-hidden">
          {(['search', 'freetext'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m === 'search' ? '🔍 Search' : '📝 Free Text'}
            </button>
          ))}
        </div>

        {/* ── MODE 1: Search ── */}
        {mode === 'search' && (
          <>
            <div className="relative mb-3">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                placeholder="Type a food name to search…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {error && !selected && <p className="text-red-500 text-sm mb-3">{error}</p>}

            {!selected && results.length > 0 && (
              <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                {results.map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { setSelected(item); setQuantity(''); setError(''); }}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        per 100g ·{' '}
                        <span className="text-orange-500 font-medium">{item.caloriesPer100g} kcal</span>
                        {' · '}
                        <span className="text-blue-500">{item.proteinPer100g}g P</span>
                        {' · '}
                        <span className="text-yellow-600">{item.carbsPer100g}g C</span>
                        {' · '}
                        <span className="text-red-400">{item.fatPer100g}g F</span>
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!selected && !searching && !hasSearched && !query && (
              <p className="text-center text-gray-400 text-sm py-6">
                Start typing to search the food database
              </p>
            )}

            {/* Quantity panel */}
            {selected && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-medium text-gray-900 leading-snug flex-1 mr-2">
                    {selected.productName}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {selected.caloriesPer100g} kcal / 100g
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 whitespace-nowrap">Quantity (g):</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    autoFocus
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 150"
                  />
                </div>

                {/* Live macro preview */}
                {quantity && parseFloat(quantity) > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    {(() => {
                      const m = calcMacros(selected, parseFloat(quantity));
                      return [
                        { label: 'Calories', value: m.calories, unit: 'kcal', color: 'text-orange-500' },
                        { label: 'Protein',  value: m.proteinG,  unit: 'g',    color: 'text-blue-500' },
                        { label: 'Carbs',    value: m.carbsG,    unit: 'g',    color: 'text-yellow-600' },
                        { label: 'Fat',      value: m.fatG,      unit: 'g',    color: 'text-red-400' },
                      ].map(({ label, value, unit, color }) => (
                        <div key={label} className="bg-white rounded-lg py-2">
                          <p className={`font-semibold ${color}`}>{value}<span className="text-gray-400 font-normal">{unit}</span></p>
                          <p className="text-gray-500 mt-0.5">{label}</p>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setSelected(null); setTimeout(() => inputRef.current?.focus(), 0); }}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={saving || !quantity || parseFloat(quantity) <= 0}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? 'Saving…' : 'Add to log'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── MODE 2: Free Text ── */}
        {mode === 'freetext' && (
          <>
            <div className="relative mb-2">
              <input
                ref={inputRef}
                type="text"
                value={ftQuery}
                onChange={(e) => setFtQuery(e.target.value)}
                placeholder="e.g. 200g chicken breast with rice and a banana"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-3">
              Describe your meal naturally — include amounts for best accuracy
            </p>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            {!ftHasSearched && !searching && !ftQuery && (
              <p className="text-center text-gray-400 text-sm py-6">
                Describe what you ate and we'll calculate the macros
              </p>
            )}

            {/* Breakdown of matched foods */}
            {ftResults.length > 0 && (
              <>
                <ul className="divide-y divide-gray-100 max-h-40 overflow-y-auto rounded-lg border border-gray-200 mb-3">
                  {ftResults.map((item, i) => {
                    const m = itemActualMacros(item);
                    return (
                      <li key={i} className="px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-800">{item.productName}</p>
                          <span className="text-xs text-gray-400">{item.servingSizeG}g</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="text-orange-500 font-medium">{m.calories} kcal</span>
                          {' · '}
                          <span className="text-blue-500">{m.proteinG}g P</span>
                          {' · '}
                          <span className="text-yellow-600">{m.carbsG}g C</span>
                          {' · '}
                          <span className="text-red-400">{m.fatG}g F</span>
                        </p>
                      </li>
                    );
                  })}
                </ul>

                {/* Total macros summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      { label: 'Calories', value: ftTotals.calories, unit: 'kcal', color: 'text-orange-500' },
                      { label: 'Protein',  value: ftTotals.proteinG,  unit: 'g',    color: 'text-blue-500' },
                      { label: 'Carbs',    value: ftTotals.carbsG,    unit: 'g',    color: 'text-yellow-600' },
                      { label: 'Fat',      value: ftTotals.fatG,      unit: 'g',    color: 'text-red-400' },
                    ].map(({ label, value, unit, color }) => (
                      <div key={label} className="bg-white rounded-lg py-2">
                        <p className={`font-semibold ${color}`}>{value}<span className="text-gray-400 font-normal">{unit}</span></p>
                        <p className="text-gray-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                <button
                  onClick={handleFtAdd}
                  disabled={saving}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving…' : 'Add to log'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
