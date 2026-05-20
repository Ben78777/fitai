import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend, ReferenceLine,
  ComposedChart,
} from 'recharts';
import { getAnalytics, postPredict } from '../lib/api';
import type { AnalyticsData, PredictResponse, ProgressData, UserProfile } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type DayFilter = 7 | 30 | 90 | 0; // 0 = all time
type PredUnit  = 'days' | 'weeks' | 'months' | 'years';

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

const UNIT_MULTIPLIERS: Record<PredUnit, number> = {
  days: 1, weeks: 7, months: 30, years: 365,
};

/** Human-readable range label, e.g. "4 weeks (28 days)" or "30 days". */
function rangeLabel(value: number, unit: PredUnit, days: number): string {
  if (unit === 'days') return `${days} day${days !== 1 ? 's' : ''}`;
  const labels: Record<PredUnit, [string, string]> = {
    days:   ['day',   'days'],
    weeks:  ['week',  'weeks'],
    months: ['month', 'months'],
    years:  ['year',  'years'],
  };
  const word = value === 1 ? labels[unit][0] : labels[unit][1];
  return `${value} ${word} (${days} days)`;
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: DayFilter }[] = [
  { label: '7d',  value: 7  },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: 'All', value: 0  },
];

function FilterBar({ active, onChange }: { active: DayFilter; onChange: (v: DayFilter) => void }) {
  return (
    <div className="flex gap-1.5">
      {FILTERS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            active === value
              ? 'bg-green-500 text-white border-green-500'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Calorie history bar chart ─────────────────────────────────────────────────

function CalorieChart({ data, target }: { data: AnalyticsData['dailyCalories']; target: number }) {
  if (data.length === 0) {
    return <EmptyState message="No calorie data logged yet." />;
  }

  const chartData = data.map(d => ({
    date:     shortDate(d.date),
    calories: Math.round(d.calories),
    target,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v: unknown) => [`${Number(v).toLocaleString()} kcal`]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        {target > 0 && (
          <ReferenceLine y={target} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'target', fontSize: 10, fill: '#94a3b8', position: 'right' }} />
        )}
        <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.calories <= (target || Infinity) ? '#22c55e' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Macro history line chart ───────────────────────────────────────────────────

function MacroChart({ data }: { data: AnalyticsData['dailyCalories'] }) {
  if (data.length === 0) {
    return <EmptyState message="No macro data logged yet." />;
  }

  const chartData = data.map(d => ({
    date:    shortDate(d.date),
    Protein: Math.round(d.proteinG),
    Carbs:   Math.round(d.carbsG),
    Fat:     Math.round(d.fatG),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="g" />
        <Tooltip
          formatter={(v: unknown, name: unknown) => [`${Number(v)}g`, String(name)]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="Protein" stroke="#3b82f6" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="Carbs"   stroke="#f59e0b" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="Fat"     stroke="#ec4899" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Weight chart ──────────────────────────────────────────────────────────────

function WeightChart({ data }: { data: AnalyticsData['weightLogs'] }) {
  if (data.length === 0) {
    return <EmptyState message="No weight logs yet. Use 'Log Weight' to start tracking." />;
  }

  const chartData = data.map(d => ({
    date:   shortDate(d.date),
    Weight: Number(d.weightKg),
  }));

  const weights = chartData.map(d => d.Weight);
  const minW    = Math.floor(Math.min(...weights) - 1);
  const maxW    = Math.ceil(Math.max(...weights)  + 1);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[minW, maxW]} unit="kg" />
        <Tooltip
          formatter={(v: unknown) => [`${Number(v)} kg`, 'Weight']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Line type="monotone" dataKey="Weight" stroke="#8b5cf6" dot={{ r: 3 }} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Prediction combo chart ────────────────────────────────────────────────────

interface PredictionChartProps {
  prediction:   PredictResponse;
  displayValue: number;   // the number the user entered (e.g. 4)
  displayUnit:  PredUnit; // the unit they chose (e.g. 'weeks')
  displayDays:  number;   // the converted total days sent to the backend (e.g. 28)
}

function PredictionChart({ prediction, displayValue, displayUnit, displayDays }: PredictionChartProps) {
  const points = prediction.projectionPoints;
  if (points.length === 0) return null;

  const chartData = points.map(p => ({
    date:      shortDate(p.date),
    Actual:    p.actual != null ? Number(p.actual) : null,
    Predicted: Number(p.predicted),
  }));

  const allWeights = chartData.flatMap(d =>
    [d.Actual, d.Predicted].filter((v): v is number => v != null)
  );
  // Guard against a flat maintenance line where min===max, which collapses the Y axis
  const rawMin = Math.min(...allWeights);
  const rawMax = Math.max(...allWeights);
  const minW = Math.floor(rawMin - (rawMin === rawMax ? 1 : 0.5));
  const maxW = Math.ceil( rawMax + (rawMin === rawMax ? 1 : 0.5));

  const changeKg  = Number(prediction.estimatedChangeKg);
  const changeAbs = Math.abs(changeKg).toFixed(2);
  const offset    = prediction.dailyDeficitUsed;
  const range     = rangeLabel(displayValue, displayUnit, displayDays);

  let changeSummary: React.ReactNode;
  if (prediction.goal === 'maintenance') {
    changeSummary = (
      <span className="font-semibold text-blue-600">
        At maintenance — no weight change predicted
      </span>
    );
  } else if (prediction.goal === 'cutting') {
    changeSummary = (
      <span className="font-semibold text-green-600">
        Based on your {offset} kcal daily deficit: estimated loss of {changeAbs} kg in {range}
      </span>
    );
  } else {
    // bulking
    changeSummary = (
      <span className="font-semibold text-orange-500">
        Based on your {offset} kcal daily surplus: estimated gain of {changeAbs} kg in {range}
      </span>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600">
        <span>
          Current: <strong className="text-gray-900">{Number(prediction.currentWeight).toFixed(1)} kg</strong>
        </span>
        {prediction.goal !== 'maintenance' && (
          <span>
            After {range}:{' '}
            <strong className="text-gray-900">{Number(prediction.predictedWeight).toFixed(1)} kg</strong>
          </span>
        )}
        {changeSummary}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[minW, maxW]} unit="kg" />
          <Tooltip
            formatter={(v: unknown, name: unknown) => [`${Number(v)} kg`, String(name)]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* Solid line for actual weight logs */}
          <Line
            type="monotone"
            dataKey="Actual"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          {/* Dashed line for prediction */}
          <Line
            type="monotone"
            dataKey="Predicted"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-sm text-gray-400">
      {message}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

// ── Current stats strip (shown inside prediction card) ────────────────────────

function StatsStrip({ progressData }: { progressData: ProgressData }) {
  const { goal, calorieTargetOffset, tdee, dailyCalorieTarget } = progressData;
  const deficitLabel = goal === 'cutting' ? 'Daily deficit' : goal === 'bulking' ? 'Daily surplus' : 'Offset';
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
      <span>
        Goal:{' '}
        <strong className="text-gray-900 capitalize">{goal}</strong>
      </span>
      <span>
        TDEE:{' '}
        <strong className="text-gray-900">{tdee.toLocaleString()} kcal</strong>
      </span>
      <span>
        {deficitLabel}:{' '}
        <strong className="text-gray-900">{calorieTargetOffset.toLocaleString()} kcal</strong>
      </span>
      <span>
        Daily target:{' '}
        <strong className="text-gray-900">{Math.round(dailyCalorieTarget).toLocaleString()} kcal</strong>
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  /** Full profile — its key primitive fields are watched as fetchAnalytics deps. */
  userProfile:  UserProfile | null;
  /** Progress data — provides TDEE and target for the stats strip. */
  progressData: ProgressData | null;
}

export default function AnalyticsPage({ userProfile, progressData }: Props) {
  // ── Analytics (chart history) ─────────────────────────────────────────────
  const [filter,    setFilter]    = useState<DayFilter>(30);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // ── Prediction (independent from analytics) ───────────────────────────────
  const [prediction,    setPrediction]    = useState<PredictResponse | null>(null);
  const [predLoading,   setPredLoading]   = useState(false);
  // What was last used when Calculate was pressed (drives the display text)
  const [lastDays,      setLastDays]      = useState(30);
  const [lastValue,     setLastValue]     = useState(30);
  const [lastUnit,      setLastUnit]      = useState<PredUnit>('days');
  // Input state for the calculate form
  const [predValue,     setPredValue]     = useState(30);
  const [predUnit,      setPredUnit]      = useState<PredUnit>('days');
  const [predError,     setPredError]     = useState('');

  // ── Analytics fetch (triggered by filter; profile-change remount handles the rest) ──

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAnalytics(await getAnalytics(filter));
    } catch {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // ── Prediction fetch (shared by auto-load and Calculate button) ───────────

  const runPrediction = useCallback(async (days: number, value: number, unit: PredUnit) => {
    setPredLoading(true);
    try {
      const data = await postPredict(days);
      setPrediction(data);
      setLastDays(days);
      setLastValue(value);
      setLastUnit(unit);
    } catch { /* silently fail — charts still render without prediction */ }
    finally { setPredLoading(false); }
  }, []);

  // Auto-load prediction with the default 30-day horizon on mount
  useEffect(() => {
    runPrediction(30, 30, 'days');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Calculate handler ─────────────────────────────────────────────────────

  function handleCalculate() {
    const intValue = Math.floor(predValue);
    if (!isFinite(intValue) || intValue < 1) {
      setPredError('Please enter a value between 1 day and 10 years');
      return;
    }
    const days = intValue * UNIT_MULTIPLIERS[predUnit];
    if (days > 3650) {
      setPredError('Please enter a value between 1 day and 10 years');
      return;
    }
    setPredError('');
    runPrediction(days, intValue, predUnit);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Filter bar — controls the chart history window only */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-500">
          {analytics ? `${analytics.dailyCalories.length} days of data` : 'Loading…'}
        </p>
        <FilterBar active={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 text-center py-10">{error}</div>
      ) : analytics ? (
        <div className="space-y-4">
          {/* Average callout */}
          {analytics.dailyCalories.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-xs text-green-700 font-medium">Average daily calories</p>
                <p className="text-lg font-bold text-green-800">
                  {Math.round(Number(analytics.averageCalories)).toLocaleString()} kcal
                  {analytics.calorieTarget > 0 && (
                    <span className="text-xs font-normal text-green-600 ml-1.5">
                      / {Math.round(Number(analytics.calorieTarget)).toLocaleString()} target
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          <Card title="📅 Calorie History">
            <CalorieChart
              data={analytics.dailyCalories}
              target={Number(analytics.calorieTarget)}
            />
          </Card>

          <Card title="🥩 Macros Over Time">
            <MacroChart data={analytics.dailyCalories} />
          </Card>

          <Card title="⚖️ Weight Over Time">
            <WeightChart data={analytics.weightLogs} />
          </Card>

          {/* ── Weight Prediction ─────────────────────────────────────── */}
          <Card title="🔮 Weight Prediction">
            {/* Current profile stats — gives context before the user runs a prediction */}
            {progressData && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium">Your current stats</p>
                <StatsStrip progressData={progressData} />
              </div>
            )}

            {/* Free-range prediction input */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-600 whitespace-nowrap">Predict my weight in</span>
                <input
                  type="number"
                  min={1}
                  value={predValue}
                  onChange={e => {
                    setPredValue(Number(e.target.value));
                    setPredError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleCalculate()}
                  className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-green-400"
                />
                <select
                  value={predUnit}
                  onChange={e => { setPredUnit(e.target.value as PredUnit); setPredError(''); }}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
                <button
                  onClick={handleCalculate}
                  disabled={predLoading}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {predLoading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      Calculating…
                    </>
                  ) : (
                    'Calculate →'
                  )}
                </button>
              </div>
              {predError && (
                <p className="text-xs text-red-500">{predError}</p>
              )}
            </div>

            {/* Chart — only rendered once prediction data is available */}
            {prediction && !predLoading && (
              <PredictionChart
                prediction={prediction}
                displayValue={lastValue}
                displayUnit={lastUnit}
                displayDays={lastDays}
              />
            )}
            {predLoading && !prediction && (
              <div className="flex items-center justify-center h-24">
                <div className="w-5 h-5 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
