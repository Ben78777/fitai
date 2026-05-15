import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getLog, getProgress } from '../lib/api';
import MacroSummary from './MacroSummary';
import DailyLog from './DailyLog';
import ProgressDashboard from './ProgressDashboard';
import type { LogEntry, ProgressData } from '../types';

// ── Date helpers (all local-time — avoids UTC midnight off-by-one) ──────────

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getToday(): string {
  return toDateString(new Date());
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

function formatDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Chevron icons ────────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [selectedDate,  setSelectedDate]  = useState(getToday);
  const [entries,       setEntries]       = useState<LogEntry[]>([]);
  const [progressData,  setProgressData]  = useState<ProgressData | null>(null);
  const [initialLoad,   setInitialLoad]   = useState(true);
  const [fetching,      setFetching]      = useState(false);

  const isToday = selectedDate === getToday();

  // Memoised so useEffect only re-runs when selectedDate actually changes
  const fetchLog = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getLog(selectedDate);
      setEntries(data);
    } catch {
      // Silently clear — user sees empty state rather than stale data
      setEntries([]);
    } finally {
      setFetching(false);
      setInitialLoad(false);
    }
  }, [selectedDate]);

  // Progress is always today-centric — fetched independently of date navigation
  async function fetchProgressData() {
    try {
      setProgressData(await getProgress());
    } catch { /* silently fail — card just stays hidden */ }
  }

  // Re-fetch log whenever selectedDate changes (and on mount)
  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  // Fetch progress once on mount
  useEffect(() => {
    fetchProgressData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Called by DailyLog after any add/remove — keeps progress in sync
  async function handleRefresh() {
    await Promise.all([fetchLog(), fetchProgressData()]);
  }

  function goBack()    { setSelectedDate(prev => shiftDate(prev, -1)); }
  function goForward() { if (!isToday) setSelectedDate(prev => shiftDate(prev, +1)); }

  async function handleLogout() {
    await supabase.auth.signOut();
    // App.tsx session listener redirects to Auth screen
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Title + logout row */}
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">FitAI</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Date navigation row */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center justify-center gap-3">
          {/* Back arrow — always enabled */}
          <button
            onClick={goBack}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft />
          </button>

          {/* Date label */}
          <div className="text-center min-w-[200px]">
            {isToday && (
              <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-0.5">
                Today
              </p>
            )}
            <p className={`text-sm font-medium ${isToday ? 'text-gray-900' : 'text-gray-700'}`}>
              {formatDisplay(selectedDate)}
            </p>
          </div>

          {/* Forward arrow — hidden when on today */}
          <button
            onClick={goForward}
            disabled={isToday}
            className={`p-1.5 rounded-lg transition-colors ${
              isToday
                ? 'text-gray-200 cursor-default'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Next day"
            aria-disabled={isToday}
          >
            <ChevronRight />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {initialLoad ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : (
          // Dim the content while a new day's data is loading
          <div className={fetching ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
            {progressData && <ProgressDashboard data={progressData} />}
            <MacroSummary entries={entries} />
            <DailyLog entries={entries} date={selectedDate} onRefresh={handleRefresh} />
          </div>
        )}
      </main>
    </div>
  );
}
