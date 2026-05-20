import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend, ReferenceLine,
  ComposedChart,
} from 'recharts';
import { getAnalytics, postPredict } from '../lib/api';
import type { AnalyticsData, PredictResponse, UserProfile } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type DayFilter = 7 | 30 | 90 | 0; // 0 = all time

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
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

  const weights  = chartData.map(d => d.Weight);
  const minW     = Math.floor(Math.min(...weights) - 1);
  const maxW     = Math.ceil(Math.max(...weights)  + 1);

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

function PredictionChart({ prediction }: { prediction: PredictResponse }) {
  const points = prediction.projectionPoints;
  if (points.length === 0) return null;

  const chartData = points.map(p => ({
    date:      shortDate(p.date),
    Actual:    p.actual    != null ? Number(p.actual)    : null,
    Predicted: Number(p.predicted),
  }));

  const allWeights = chartData.flatMap(d =>
    [d.Actual, d.Predicted].filter((v): v is number => v != null)
  );
  // Guard against a flat maintenance line where min===max, which would collapse the Y axis
  const rawMin = Math.min(...allWeights);
  const rawMax = Math.max(...allWeights);
  const minW = Math.floor(rawMin - (rawMin === rawMax ? 1 : 0.5));
  const maxW = Math.ceil( rawMax + (rawMin === rawMax ? 1 : 0.5));

  // Goal-aware summary text, referencing the actual offset used
  const changeKg  = Number(prediction.estimatedChangeKg);
  const changeAbs = Math.abs(changeKg).toFixed(2);
  const offset    = prediction.dailyDeficitUsed;
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
        Based on your {offset} kcal daily deficit: estimated loss of {changeAbs} kg in {prediction.projectionDays} days
      </span>
    );
  } else {
    // bulking
    changeSummary = (
      <span className="font-semibold text-orange-500">
        Based on your {offset} kcal daily surplus: estimated gain of {changeAbs} kg in {prediction.projectionDays} days
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
            In {prediction.projectionDays}d:{' '}
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

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  /** Passed from Dashboard — specific primitive fields are used as fetchData deps
   *  so any profile change (goal, offset, weight, activity) triggers a re-fetch. */
  userProfile: UserProfile | null;
}

export default function AnalyticsPage({ userProfile }: Props) {
  const [filter,     setFilter]     = useState<DayFilter>(30);
  const [analytics,  setAnalytics]  = useState<AnalyticsData | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsData, predictData] = await Promise.all([
        getAnalytics(filter),
        postPredict(filter === 0 ? 30 : filter), // always project forward 30 days for "all time"
      ]);
      setAnalytics(analyticsData);
      setPrediction(predictData);
    } catch {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  // Individual primitive fields as deps — any profile change (goal, offset, weight, activity)
  // causes React to see a new value and re-run fetchData immediately.
  }, [filter, userProfile?.goal, userProfile?.calorieTargetOffset, userProfile?.activityLevel, userProfile?.weightKg]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-500">
          {analytics
            ? `${analytics.dailyCalories.length} days of data`
            : 'Loading…'}
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
        // key on the outer div forces recharts to fully remount when analytics data changes
        <div key={`${userProfile?.goal}-${userProfile?.calorieTargetOffset}`} className="space-y-4">
          {/* Avg callout */}
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

          {prediction && (
            <Card title="🔮 Weight Prediction">
              <PredictionChart prediction={prediction} />
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
