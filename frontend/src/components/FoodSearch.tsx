import { useState, useRef, useEffect } from 'react';
import { analyzeFood, analyzeFoodImage, addLogEntry } from '../lib/api';
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

/** Read a File and return its raw base64 content (no data: prefix) */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FoodSearch({ mealType, date, onAdded, onClose }: Props) {
  const [query,        setQuery]        = useState('');
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [items,        setItems]        = useState<FoodAnalysisItem[]>([]);
  // edited quantities per row — stored as strings so the input stays responsive
  const [qtys,         setQtys]         = useState<string[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  // ── Text analysis ──────────────────────────────────────────────

  async function handleAnalyze() {
    // If an image is loaded, re-analyze it; otherwise use the text query
    if (imageFile) {
      await runImageAnalysis(imageFile);
      return;
    }
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

  // ── Image analysis ─────────────────────────────────────────────

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setImageFile(file);
    setQuery(''); // text and image are mutually exclusive
    // Auto-trigger analysis as soon as the image is picked
    await runImageAnalysis(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  async function runImageAnalysis(file: File) {
    setLoading(true); setError(''); setItems([]); setQtys([]);
    try {
      const base64 = await fileToBase64(file);
      const data   = await analyzeFoodImage(base64, file.type);
      setItems(data);
      setQtys(data.map((d) => String(d.quantityG)));
    } catch {
      setError('Analysis failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview('');
    setItems([]);
    setQtys([]);
    setError('');
  }

  // ── Log all items ──────────────────────────────────────────────

  async function handleLog() {
    setSaving(true); setError('');
    try {
      // Log each food item as a separate entry, respecting edited quantities
      for (let i = 0; i < items.length; i++) {
        const qty    = parseFloat(qtys[i]);
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

        {/* Input area */}
        <div className="mb-4 space-y-2">
          {/* Tall textarea — Shift+Enter for newline, Enter to analyze */}
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Typing clears any uploaded image
              if (imageFile) clearImage();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !loading) {
                e.preventDefault();
                handleAnalyze();
              }
            }}
            placeholder={"e.g. 200g chicken breast, 100g rice and salad\nShift+Enter for new line · Enter to analyze"}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />

          {/* Image preview (shown when a photo has been picked) */}
          {imagePreview && (
            <div className="flex items-center gap-3 px-1">
              <img
                src={imagePreview}
                alt="Food photo"
                className="h-14 w-14 object-cover rounded-lg border border-gray-200"
              />
              <span className="text-sm text-gray-500 flex-1">Photo ready — analyzing…</span>
              <button
                onClick={clearImage}
                className="text-gray-400 hover:text-red-500 text-lg leading-none"
                title="Remove photo"
              >✕</button>
            </div>
          )}

          {/* Action row: photo upload button + analyze button */}
          <div className="flex items-center gap-2">
            {/* Hidden file input — accepts any image format */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-1.5 border border-gray-300 hover:border-gray-400 disabled:opacity-50 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Upload a food photo"
            >
              <span>📷</span> Photo
            </button>

            <button
              onClick={handleAnalyze}
              disabled={loading || (!query.trim() && !imageFile)}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Analyzing…
                </span>
              ) : 'Analyze'}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Empty state */}
        {!loading && items.length === 0 && !error && (
          <p className="text-center text-gray-400 text-sm py-6">
            Type any food or meal and press Analyze, or upload a photo 📷
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
