import { useState, useEffect, useRef } from 'react';
import { searchFood, addLogEntry } from '../lib/api';
import type { FoodSearchResult, MealType } from '../types';

interface Props {
  mealType: MealType;
  date: string;
  onAdded: () => void;
  onClose: () => void;
}

type Mode = 'search' | 'manual';

function calcMacros(food: FoodSearchResult, grams: number) {
  const f = grams / 100;
  const r = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: r(food.caloriesPer100g * f),
    proteinG: r(food.proteinPer100g  * f),
    carbsG:   r(food.carbsPer100g    * f),
    fatG:     r(food.fatPer100g      * f),
  };
}

export default function FoodSearch({ mealType, date, onAdded, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('search');

  // ── Mode 1 (Search) ────────────────────────────────────────────
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<FoodSearchResult[]>([]);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // ── Mode 2 (Manual Entry) ──────────────────────────────────────
  const [manualName,     setManualName]     = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein,  setManualProtein]  = useState('');
  const [manualCarbs,    setManualCarbs]    = useState('');
  const [manualFat,      setManualFat]      = useState('');
  const [manualServing,  setManualServing]  = useState('');

  // ── Shared ─────────────────────────────────────────────────────
  const [searching, setSearching] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounced live search — Mode 1
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
      } catch {
        setError('Search failed. Check your connection and try again.');
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mode]);

  // ── Handlers ───────────────────────────────────────────────────

  async function handleAdd() {
    if (!selected) return;
    const grams = parseFloat(quantity);
    if (isNaN(grams) || grams <= 0) { setError('Enter a valid quantity in grams.'); return; }
    setSaving(true); setError('');
    try {
      const macros = calcMacros(selected, grams);
      await addLogEntry({ date, mealType, foodName: selected.productName, quantityG: grams, ...macros });
      onAdded(); onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleManualAdd() {
    const cal = parseFloat(manualCalories);
    if (!manualName.trim() || isNaN(cal) || cal <= 0) {
      setError('Food name and calories are required.');
      return;
    }
    setSaving(true); setError('');
    try {
      await addLogEntry({
        date,
        mealType,
        foodName: manualName.trim(),
        quantityG: parseFloat(manualServing) || 0,
        calories:  cal,
        proteinG:  parseFloat(manualProtein)  || 0,
        carbsG:    parseFloat(manualCarbs)    || 0,
        fatG:      parseFloat(manualFat)      || 0,
      });
      onAdded(); onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(''); setSearching(false);
    if (next === 'search') { setResults([]); setSelected(null); setQuantity(''); setHasSearched(false); }
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
          {([['search', '🔍 Search'], ['manual', '✏️ Manual Entry']] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === m ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ══ MODE 1: Search ══════════════════════════════════════ */}
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
                Start typing to search millions of foods
              </p>
            )}

            {/* Quantity panel */}
            {selected && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-medium text-gray-900 leading-snug flex-1 mr-2">{selected.productName}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{selected.caloriesPer100g} kcal / 100g</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 whitespace-nowrap">Quantity (g):</label>
                  <input
                    type="number" min="0.1" step="any" value={quantity} autoFocus
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 150"
                  />
                </div>

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

        {/* ══ MODE 2: Manual Entry ════════════════════════════════ */}
        {mode === 'manual' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              For restaurant meals, home cooking, or anything not in the database — enter the macros yourself.
            </p>

            {/* Food name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Food name *</label>
              <input
                ref={inputRef}
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Chicken Salad, Homemade Burger…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Macro grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories (kcal) *', value: manualCalories, setter: setManualCalories, color: 'focus:ring-orange-400', placeholder: 'e.g. 350' },
                { label: 'Protein (g)',        value: manualProtein,  setter: setManualProtein,  color: 'focus:ring-blue-400',   placeholder: 'e.g. 25' },
                { label: 'Carbs (g)',          value: manualCarbs,    setter: setManualCarbs,    color: 'focus:ring-yellow-400', placeholder: 'e.g. 30' },
                { label: 'Fat (g)',            value: manualFat,      setter: setManualFat,      color: 'focus:ring-red-400',    placeholder: 'e.g. 12' },
              ].map(({ label, value, setter, color, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="number" min="0" step="any"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${color}`}
                  />
                </div>
              ))}
            </div>

            {/* Serving size (optional) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Serving size (g) — optional</label>
              <input
                type="number" min="0" step="any"
                value={manualServing}
                onChange={(e) => setManualServing(e.target.value)}
                placeholder="e.g. 250"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleManualAdd}
              disabled={saving || !manualName.trim() || !manualCalories}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Add to log'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
