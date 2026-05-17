import { useEffect, useState } from 'react';
import { logWeight } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill input with the user's last logged weight (from latest log or profile) */
  lastWeight?: number;
  /** Called with the saved weight so Dashboard can update state immediately */
  onSaved: (weightKg: number) => void;
}

export default function WeightLogModal({ isOpen, onClose, lastWeight, onSaved }: Props) {
  const [input,   setInput]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Pre-fill whenever modal opens or lastWeight changes
  useEffect(() => {
    if (isOpen) {
      setInput(lastWeight != null ? String(lastWeight) : '');
      setError('');
    }
  }, [isOpen, lastWeight]);

  const parsed   = parseFloat(input);
  const isValid  = !isNaN(parsed) && parsed >= 20 && parsed <= 500;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      await logWeight(parsed);
      onSaved(parsed);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      {/* Card — stop click from closing when clicking inside */}
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-base font-semibold text-gray-900 mb-1">Log today's weight</h2>
        <p className="text-xs text-gray-500 mb-4">
          Tracking your weight weekly helps the prediction model stay accurate.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={20}
              max={500}
              step={0.1}
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. 75.5"
              className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                !isValid && input ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <span className="text-sm text-gray-500 font-medium">kg</span>
          </div>

          {!isValid && input && (
            <p className="text-xs text-red-500 -mt-2">Must be between 20 and 500 kg</p>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!isValid || saving}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
