import { useState } from 'react';
import { patchProfile } from '../lib/api';
import type { ProgressData } from '../types';

interface Props {
  progressData: ProgressData;
  onOffsetSaved: () => void; // tells Dashboard to re-fetch progress after a save
}

const GOAL_CONFIG: Record<string, { label: string; emoji: string; colorCls: string }> = {
  cutting:     { label: 'Cutting',              emoji: '🔴', colorCls: 'bg-red-50 text-red-700 border-red-200'   },
  bulking:     { label: 'Bulking',              emoji: '🟢', colorCls: 'bg-green-50 text-green-700 border-green-200' },
  maintenance: { label: 'Just counting calories', emoji: '⚪', colorCls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none"
         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

export default function GoalInfoBar({ progressData, onOffsetSaved }: Props) {
  const { goal, calorieTargetOffset } = progressData;
  const isMaintenance = goal === 'maintenance';

  const [editing,  setEditing]  = useState(false);
  const [inputVal, setInputVal] = useState(String(calorieTargetOffset));
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const config = GOAL_CONFIG[goal] ?? GOAL_CONFIG['maintenance'];
  const offsetLabel = goal === 'cutting' ? 'deficit target' : 'surplus target';

  // Valid input: integer in [100, 2000]
  const parsed = parseInt(inputVal, 10);
  const inputValid = !isNaN(parsed) && parsed >= 100 && parsed <= 2000;

  function startEditing() {
    setInputVal(String(calorieTargetOffset));
    setError('');
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError('');
  }

  async function handleSave() {
    if (!inputValid) return;
    setSaving(true);
    setError('');
    try {
      await patchProfile({ calorieTargetOffset: parsed });
      setEditing(false);
      onOffsetSaved(); // Dashboard will re-fetch /api/v1/progress
    } catch {
      setError('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') cancelEditing();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-2 flex items-center gap-3 flex-wrap">

      {/* Goal badge */}
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${config.colorCls}`}>
        {config.emoji} {config.label}
      </span>

      {/* Calorie offset — hidden for maintenance */}
      {!isMaintenance && (
        editing ? (
          // ── Edit mode ──
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center">
              <input
                type="number"
                min={100}
                max={2000}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className={`w-20 text-sm border rounded-l-lg px-2 py-1 focus:outline-none focus:ring-1 ${
                  inputValid
                    ? 'border-gray-300 focus:ring-green-500'
                    : 'border-red-400 focus:ring-red-400'
                }`}
              />
              <span className="text-xs text-gray-500 border border-l-0 border-gray-300 bg-gray-50 rounded-r-lg px-2 py-1">
                kcal
              </span>
            </div>
            {!inputValid && (
              <span className="text-xs text-red-500">100–2000</span>
            )}
            <button
              onClick={handleSave}
              disabled={!inputValid || saving}
              className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg transition-colors"
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              onClick={cancelEditing}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        ) : (
          // ── Display mode ──
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">
              {calorieTargetOffset.toLocaleString()} kcal {offsetLabel}
            </span>
            <button
              onClick={startEditing}
              className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded"
              aria-label="Edit calorie offset"
            >
              <PencilIcon />
            </button>
          </div>
        )
      )}
    </div>
  );
}
