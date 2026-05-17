import { useState } from 'react';
import { createProfile } from '../lib/api';

interface Props {
  onComplete: () => void;
}

type Goal = 'cutting' | 'bulking' | 'maintenance';
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: 'cutting',     label: '🔥 Cutting',               description: 'Lose body fat'    },
  { value: 'bulking',     label: '💪 Bulking',               description: 'Gain muscle mass' },
  { value: 'maintenance', label: '⚖️ Just counting calories', description: 'Maintain weight'  },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary',         label: 'Sedentary',         description: '0 workouts/week'            },
  { value: 'lightly_active',    label: 'Lightly Active',    description: '1–2 workouts/week'          },
  { value: 'moderately_active', label: 'Moderately Active', description: '3–4 workouts/week'          },
  { value: 'very_active',       label: 'Very Active',       description: '5–6 workouts/week'          },
  { value: 'extremely_active',  label: 'Extremely Active',  description: '7+ workouts/week, intense'  },
];

export default function Onboarding({ onComplete }: Props) {
  const [name,                setName]                = useState('');
  const [gender,              setGender]              = useState('');
  const [age,                 setAge]                 = useState('');
  const [weightKg,            setWeightKg]            = useState('');
  const [heightCm,            setHeightCm]            = useState('');
  const [goal,                setGoal]                = useState<Goal | ''>('');
  const [activityLevel,       setActivityLevel]       = useState<ActivityLevel | ''>('');
  const [calorieTargetOffset, setCalorieTargetOffset] = useState('500');
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState('');

  // Only Cutting and Bulking show the calorie offset field
  const showCalorieTarget = goal === 'cutting' || goal === 'bulking';
  const calorieTargetLabel = goal === 'cutting'
    ? 'Daily deficit target (kcal)'
    : 'Daily surplus target (kcal)';

  const canSubmit = name.trim() && gender && age && weightKg && heightCm && activityLevel && goal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);

    try {
      await createProfile({
        name:                name.trim(),
        gender,
        age:                 parseInt(age, 10),
        weightKg:            parseFloat(weightKg),
        heightCm:            parseFloat(heightCm),
        goal,
        activityLevel:       activityLevel as ActivityLevel,
        // For maintenance the offset is unused — pass the default so the column is never null
        calorieTargetOffset: showCalorieTarget ? parseInt(calorieTargetOffset, 10) : 500,
      });
      onComplete();
    } catch (err: unknown) {
      // If a profile already exists (e.g. double-submit), just proceed
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        onComplete();
        return;
      }
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome to FitAI! 👋</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tell us a bit about yourself so we can personalise your experience.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    gender === g
                      ? 'bg-green-500 text-white border-green-500'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {g === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
          </div>

          {/* Age / Weight / Height — three columns */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="70"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                required
                min="50"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Activity level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How many times do you work out per week?
            </label>
            <div className="flex flex-col gap-2">
              {ACTIVITY_LEVELS.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActivityLevel(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm border text-left transition-colors ${
                    activityLevel === value
                      ? 'bg-green-50 border-green-400 text-green-800'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium flex-1">{label}</span>
                  <span className="text-gray-400 text-xs">{description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Goal</label>
            <div className="flex flex-col gap-2">
              {GOALS.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoal(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm border text-left transition-colors ${
                    goal === value
                      ? 'bg-green-50 border-green-400 text-green-800'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium flex-1">{label}</span>
                  <span className="text-gray-400 text-xs">{description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calorie target — shown only for Cutting / Bulking */}
          {showCalorieTarget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {calorieTargetLabel}
              </label>
              <input
                type="number"
                required
                min="0"
                value={calorieTargetOffset}
                onChange={(e) => setCalorieTargetOffset(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Saving…' : 'Get started →'}
          </button>
        </form>
      </div>
    </div>
  );
}
