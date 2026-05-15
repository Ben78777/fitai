import type { ProgressData } from '../types';

interface Props {
  data: ProgressData;
  isToday: boolean;
  selectedDate: string;   // YYYY-MM-DD — used for the "today" label
}

export default function ProgressDashboard({ data, isToday, selectedDate }: Props) {
  const {
    dailyCalorieTarget,
    todayCalories,
    todaySurplusDeficit,
    accumulatedSurplusDeficit,
    estimatedWeightChangeKg,
    goal,
  } = data;

  const isMaintenance = goal === 'maintenance';
  const pct = dailyCalorieTarget > 0
    ? Math.min((todayCalories / dailyCalorieTarget) * 100, 100)
    : 0;
  const isOver = todayCalories > dailyCalorieTarget;

  // Green < 80%, yellow 80–100%, red over target
  const barColor = isOver
    ? 'bg-red-400'
    : pct >= 80
      ? 'bg-yellow-400'
      : 'bg-green-400';

  // Color for numeric deltas
  function deltaColor(value: number): string {
    if (isMaintenance) return 'text-gray-700';
    const good = (goal === 'cutting' && value <= 0) || (goal === 'bulking' && value >= 0);
    return good ? 'text-green-600' : 'text-red-500';
  }

  function formatDelta(kcal: number): string {
    const abs = Math.abs(kcal).toLocaleString();
    if (kcal < 0) return `−${abs} kcal deficit`;
    if (kcal > 0) return `+${abs} kcal surplus`;
    return 'On target';
  }

  // Format the selected date into a short label like "Fri, May 15"
  function dateLabel(): string {
    if (isToday) return 'Today';
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }

  const weightAbs   = Math.abs(estimatedWeightChangeKg);
  const weightLabel =
    estimatedWeightChangeKg < -0.004 ? 'Est. weight loss'
    : estimatedWeightChangeKg > 0.004 ? 'Est. weight gain'
    : 'No change yet';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Progress</h2>
        <span className="text-xs text-gray-400">{dateLabel()}</span>
      </div>

      {/* ── Calorie bar ── */}
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-2xl font-bold text-gray-900">
          {Math.round(todayCalories).toLocaleString()}
          <span className="text-sm font-normal text-gray-400 ml-1">kcal</span>
        </span>
        <span className="text-xs text-gray-400">
          of {dailyCalorieTarget.toLocaleString()} goal
        </span>
      </div>

      {/* Smooth multi-color progress bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between mb-4">
        <span className={`text-xs font-medium ${isOver ? 'text-red-500' : 'text-gray-500'}`}>
          {isOver
            ? `${(todayCalories - dailyCalorieTarget).toLocaleString()} kcal over`
            : `${(dailyCalorieTarget - todayCalories).toLocaleString()} kcal remaining`
          }
        </span>
        <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
      </div>

      {/* ── Deficit / surplus (hidden for maintenance) ── */}
      {!isMaintenance && (
        <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className={`text-sm font-semibold ${deltaColor(todaySurplusDeficit)}`}>
              {formatDelta(todaySurplusDeficit)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{dateLabel()}</p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${deltaColor(accumulatedSurplusDeficit)}`}>
              {formatDelta(accumulatedSurplusDeficit)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">All time</p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${deltaColor(accumulatedSurplusDeficit)}`}>
              {weightAbs > 0.004 ? `${estimatedWeightChangeKg > 0 ? '+' : ''}${estimatedWeightChangeKg} kg` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{weightLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}
