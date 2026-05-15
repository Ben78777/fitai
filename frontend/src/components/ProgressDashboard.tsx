import type { ProgressData } from '../types';

interface Props {
  data: ProgressData;
}

export default function ProgressDashboard({ data }: Props) {
  const {
    dailyCalorieTarget,
    todayCalories,
    todaySurplusDeficit,
    accumulatedSurplusDeficit,
    estimatedWeightChangeKg,
    goal,
  } = data;

  const isMaintenance = goal === 'maintenance';
  const isOver = todayCalories > dailyCalorieTarget;

  // How far along the progress bar (capped at 100%)
  const barPct = dailyCalorieTarget > 0
    ? Math.min((todayCalories / dailyCalorieTarget) * 100, 100)
    : 0;

  // ── Color helpers ──────────────────────────────────────────────────────────

  // For cutting: deficit (negative) is good. For bulking: surplus (positive) is good.
  function deltaColor(value: number): string {
    if (isMaintenance) return 'text-gray-700';
    const isGood =
      (goal === 'cutting' && value <= 0) ||
      (goal === 'bulking' && value >= 0);
    return isGood ? 'text-green-600' : 'text-red-500';
  }

  // ── Formatters ────────────────────────────────────────────────────────────

  function formatDelta(kcal: number): string {
    const abs = Math.abs(kcal).toLocaleString();
    if (kcal < 0) return `−${abs} kcal deficit`;
    if (kcal > 0) return `+${abs} kcal surplus`;
    return 'On target';
  }

  // Show "Estimated loss" / "Estimated gain" / "No change yet"
  const weightAbs = Math.abs(estimatedWeightChangeKg);
  const weightLabel =
    estimatedWeightChangeKg < -0.004 ? 'Estimated loss'
    : estimatedWeightChangeKg > 0.004 ? 'Estimated gain'
    : 'No change yet';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Progress</h2>

      {/* ── Calorie intake vs target ── */}
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm text-gray-500">Today's intake</span>
        <span className="text-xs text-gray-400">
          Target: {dailyCalorieTarget.toLocaleString()} kcal
        </span>
      </div>

      {/* Progress bar — turns red when over target */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOver ? 'bg-red-400' : 'bg-orange-400'
          }`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className={`text-sm font-semibold ${isOver ? 'text-red-500' : 'text-gray-900'}`}>
          {Math.round(todayCalories).toLocaleString()} kcal
        </span>
        <span className="text-xs text-gray-400">{Math.round(barPct)}%</span>
      </div>

      {/* ── Deficit / surplus section (hidden for maintenance) ── */}
      {!isMaintenance && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Today</span>
            <span className={`font-medium ${deltaColor(todaySurplusDeficit)}`}>
              {formatDelta(todaySurplusDeficit)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">All time</span>
            <span className={`font-medium ${deltaColor(accumulatedSurplusDeficit)}`}>
              {formatDelta(accumulatedSurplusDeficit)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{weightLabel}</span>
            <span className={`font-medium ${deltaColor(accumulatedSurplusDeficit)}`}>
              {weightAbs > 0.004 ? `${weightAbs} kg` : '—'}
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
