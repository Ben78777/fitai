import { useState } from 'react';
import { patchProfile } from '../lib/api';
import type { ProgressData, UpdateProfilePayload, UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  progressData: ProgressData | null;
  onSaved: () => void;
}

type Goal         = 'cutting' | 'bulking' | 'maintenance';
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

const GOAL_LABELS: Record<Goal, string> = {
  cutting:     '🔥 Cutting',
  bulking:     '💪 Bulking',
  maintenance: '⚖️ Maintenance',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary:         'Sedentary (0 workouts/week)',
  lightly_active:    'Lightly Active (1–2 workouts/week)',
  moderately_active: 'Moderately Active (3–4 workouts/week)',
  very_active:       'Very Active (5–6 workouts/week)',
  extremely_active:  'Extremely Active (7+ workouts/week, intense)',
};

const GOAL_BADGE: Record<Goal, string> = {
  cutting:     'bg-red-50 text-red-700 border-red-200',
  bulking:     'bg-green-50 text-green-700 border-green-200',
  maintenance: 'bg-gray-100 text-gray-600 border-gray-200',
};

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function ProfilePanel({ isOpen, onClose, profile, progressData, onSaved }: Props) {
  const [editing, setEditing] = useState(false);

  // Edit form state — initialised from current profile when editing starts
  const [weight,         setWeight]         = useState('');
  const [age,            setAge]            = useState('');
  const [goal,           setGoal]           = useState<Goal>(profile.goal as Goal);
  const [activityLevel,  setActivityLevel]  = useState<ActivityLevel>(profile.activityLevel as ActivityLevel);
  const [offsetInput,    setOffsetInput]    = useState('');

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function startEditing() {
    setWeight(String(profile.weightKg));
    setAge(String(profile.age));
    setGoal(profile.goal as Goal);
    setActivityLevel(profile.activityLevel as ActivityLevel);
    setOffsetInput(String(profile.calorieTargetOffset));
    setError('');
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError('');
  }

  const showOffset = goal !== 'maintenance';
  const parsedWeight = parseFloat(weight);
  const parsedAge    = parseInt(age, 10);
  const parsedOffset = parseInt(offsetInput, 10);

  const weightValid = !isNaN(parsedWeight) && parsedWeight >= 1 && parsedWeight <= 500;
  const ageValid    = !isNaN(parsedAge)    && parsedAge    >= 1 && parsedAge    <= 120;
  const offsetValid = !showOffset || (!isNaN(parsedOffset) && parsedOffset >= 100 && parsedOffset <= 2000);
  const canSave     = weightValid && ageValid && offsetValid;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const payload: UpdateProfilePayload = {
        weightKg:      parsedWeight,
        age:           parsedAge,
        goal,
        activityLevel,
        ...(showOffset ? { calorieTargetOffset: parsedOffset } : {}),
      };
      await patchProfile(payload);
      setEditing(false);
      onSaved();       // triggers Dashboard to re-fetch profile + progress
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const tdee   = progressData?.tdee   ?? 0;
  const target = progressData?.dailyCalorieTarget ?? 0;

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 sm:hidden" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl flex flex-col z-50 border-l border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
            <span className={`mt-1 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${GOAL_BADGE[profile.goal as Goal] ?? GOAL_BADGE.maintenance}`}>
              {GOAL_LABELS[profile.goal as Goal] ?? profile.goal}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close profile"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {!editing ? (
            /* ── Display mode ── */
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Weight',         value: `${profile.weightKg} kg` },
                  { label: 'Age',            value: `${profile.age} y` },
                  { label: 'Height',         value: `${profile.heightCm} cm` },
                  { label: 'Activity',       value: ACTIVITY_LABELS[profile.activityLevel as ActivityLevel] ?? profile.activityLevel },
                  { label: 'TDEE',           value: tdee > 0 ? `${tdee.toLocaleString()} kcal` : '—' },
                  { label: 'Daily target',   value: target > 0 ? `${target.toLocaleString()} kcal` : '—' },
                  ...(profile.goal !== 'maintenance' ? [
                    { label: profile.goal === 'cutting' ? 'Deficit target' : 'Surplus target',
                      value: `${profile.calorieTargetOffset.toLocaleString()} kcal` },
                  ] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Read-only info (not editable) */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                <p className="font-medium mb-0.5">Not editable</p>
                <p>Name, gender, and height can only be set during onboarding.</p>
              </div>

              <button
                onClick={startEditing}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Edit Profile
              </button>
            </>
          ) : (
            /* ── Edit mode ── */
            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number" min="1" max="500" step="0.1"
                    value={weight} onChange={e => setWeight(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${!weightValid && weight ? 'border-red-400' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number" min="1" max="120"
                    value={age} onChange={e => setAge(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${!ageValid && age ? 'border-red-400' : 'border-gray-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Goal</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cutting', 'bulking', 'maintenance'] as Goal[]).map(g => (
                    <button
                      key={g} type="button" onClick={() => setGoal(g)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        goal === g ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Activity level</label>
                <div className="space-y-1.5">
                  {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([val, lbl]) => (
                    <button
                      key={val} type="button" onClick={() => setActivityLevel(val)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors ${
                        activityLevel === val
                          ? 'bg-green-50 border-green-400 text-green-800 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {showOffset && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {goal === 'cutting' ? 'Daily deficit target (kcal)' : 'Daily surplus target (kcal)'}
                  </label>
                  <input
                    type="number" min="100" max="2000"
                    value={offsetInput} onChange={e => setOffsetInput(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${!offsetValid && offsetInput ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  <p className="text-xs text-gray-400 mt-1">Between 100 and 2,000 kcal</p>
                </div>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!canSave || saving}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button" onClick={cancelEditing}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
