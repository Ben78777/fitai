import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkWeightNudge, getLatestWeightLog, getLog, getProgress, getProfile } from '../lib/api';
import MacroSummary from './MacroSummary';
import DailyLog from './DailyLog';
import ProgressDashboard from './ProgressDashboard';
import GoalInfoBar from './GoalInfoBar';
import ChatPanel from './ChatPanel';
import ProfilePanel from './ProfilePanel';
import WeightLogModal from './WeightLogModal';
import AnalyticsPage from './AnalyticsPage';
import type { LogEntry, ProgressData, UserProfile } from '../types';

// ── Date helpers (all local-time — avoids UTC midnight off-by-one) ───────────

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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ── Icons ────────────────────────────────────────────────────────────────────

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

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// ── Active tab type ───────────────────────────────────────────────────────────

type Tab = 'log' | 'analytics';

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab,     setActiveTab]     = useState<Tab>('log');
  const [selectedDate,  setSelectedDate]  = useState(getToday);
  const [entries,       setEntries]       = useState<LogEntry[]>([]);
  const [progressData,  setProgressData]  = useState<ProgressData | null>(null);
  const [userProfile,   setUserProfile]   = useState<UserProfile | null>(null);
  const [initialLoad,   setInitialLoad]   = useState(true);
  const [fetching,      setFetching]      = useState(false);
  const [chatOpen,      setChatOpen]      = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [weightOpen,    setWeightOpen]    = useState(false);
  const [latestWeight,  setLatestWeight]  = useState<number | undefined>();
  const [showNudge,     setShowNudge]     = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(() =>
    // Remember dismissal within the session so it doesn't reappear on re-render
    sessionStorage.getItem('nudge_dismissed') === 'true'
  );

  const isToday = selectedDate === getToday();

  // ── Memoised fetch callbacks ─────────────────────────────────────────────

  const fetchLog = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getLog(selectedDate);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setFetching(false);
      setInitialLoad(false);
    }
  }, [selectedDate]);

  // Progress reflects the selected date (accumulated stats always all-time)
  const fetchProgressData = useCallback(async () => {
    try {
      setProgressData(await getProgress(selectedDate));
    } catch { /* silently fail */ }
  }, [selectedDate]);

  async function fetchUserProfile() {
    try {
      setUserProfile(await getProfile());
    } catch { /* silently fail */ }
  }

  // Fetch the latest weight log so the modal can pre-fill the field
  async function fetchLatestWeight() {
    try {
      const log = await getLatestWeightLog();
      setLatestWeight(log ? Number(log.weightKg) : undefined);
    } catch { /* silently fail */ }
  }

  // Check whether to show the weekly weight-logging nudge
  async function fetchNudge() {
    if (nudgeDismissed) return;
    try {
      const needs = await checkWeightNudge();
      setShowNudge(needs);
    } catch { /* silently fail */ }
  }

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => { fetchLog(); },           [fetchLog]);
  useEffect(() => { fetchProgressData(); },  [fetchProgressData]);

  useEffect(() => {
    fetchUserProfile();
    fetchLatestWeight();
    fetchNudge();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Event handlers ────────────────────────────────────────────────────────

  // DailyLog calls this after add/remove — keeps macros and progress in sync
  async function handleRefresh() {
    await Promise.all([fetchLog(), fetchProgressData()]);
  }

  // ProfilePanel calls this after a successful profile edit
  async function handleProfileSaved() {
    await Promise.all([fetchUserProfile(), fetchProgressData()]);
  }

  // GoalInfoBar calls this after updating the calorie offset (fix #1)
  async function handleOffsetSaved() {
    await Promise.all([fetchProgressData(), fetchUserProfile()]);
  }

  // WeightLogModal calls this after a successful save
  function handleWeightSaved(weightKg: number) {
    setLatestWeight(weightKg);
    // Dismiss nudge now that they've logged
    setShowNudge(false);
  }

  function dismissNudge() {
    setShowNudge(false);
    setNudgeDismissed(true);
    sessionStorage.setItem('nudge_dismissed', 'true');
  }

  function goBack()    { setSelectedDate(prev => shiftDate(prev, -1)); }
  function goForward() { if (!isToday) setSelectedDate(prev => shiftDate(prev, +1)); }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">

        {/* Title row */}
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥗</span>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">FitAI</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Log Weight button */}
            <button
              onClick={() => setWeightOpen(true)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-lg transition-colors"
              aria-label="Log weight"
              title="Log today's weight"
            >
              ⚖️ <span className="hidden sm:inline">Log Weight</span>
            </button>

            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              aria-label="Open profile"
            >
              <UserIcon />
              <span className="hidden sm:inline">{userProfile?.name ?? 'Profile'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Goal info bar — only on Daily Log tab */}
        {activeTab === 'log' && progressData && (
          <GoalInfoBar
            progressData={progressData}
            onOffsetSaved={handleOffsetSaved}
          />
        )}

        {/* Date navigation — only on Daily Log tab */}
        {activeTab === 'log' && (
          <div className="max-w-2xl mx-auto px-4 pb-2 flex items-center justify-center gap-2">
            <button
              onClick={goBack}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft />
            </button>

            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors ${
              isToday
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              {isToday && (
                <span className="text-xs font-bold uppercase tracking-widest text-green-600">Today</span>
              )}
              <span className="text-sm font-medium">{formatDisplay(selectedDate)}</span>
            </div>

            <button
              onClick={goForward}
              disabled={isToday}
              className={`p-2 rounded-xl transition-colors ${
                isToday
                  ? 'text-gray-200 cursor-default'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Next day"
              aria-disabled={isToday}
            >
              <ChevronRight />
            </button>
          </div>
        )}

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4 pb-0 flex border-t border-gray-100">
          {([
            { id: 'log',       label: '📋 Daily Log'  },
            { id: 'analytics', label: '📊 Analytics'  },
          ] as { id: Tab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === id
                  ? 'text-green-600 border-green-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Weight nudge banner ─────────────────────────────────────────── */}
      {showNudge && !nudgeDismissed && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg">⚖️</span>
            <p className="text-sm text-amber-800 flex-1">
              You haven't logged your weight in over a week. Log it now to keep your prediction accurate!
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setWeightOpen(true)}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Log now
              </button>
              <button
                onClick={dismissNudge}
                className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-5">

        {/* Daily Log tab */}
        {activeTab === 'log' && (
          initialLoad ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className={fetching ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
              {progressData && (
                <ProgressDashboard data={progressData} isToday={isToday} selectedDate={selectedDate} />
              )}
              <MacroSummary
                entries={entries}
                weightKg={progressData?.weightKg}
                goal={progressData?.goal}
                dailyCalorieTarget={progressData?.dailyCalorieTarget}
              />
              <DailyLog entries={entries} date={selectedDate} onRefresh={handleRefresh} />
            </div>
          )
        )}

        {/* Analytics tab */}
        {activeTab === 'analytics' && (
          <AnalyticsPage />
        )}
      </main>

      {/* ── Floating chat button ─────────────────────────────────────────── */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center transition-colors z-40"
        aria-label="Open AI assistant"
      >
        💬
      </button>

      {/* ── Modals & panels ─────────────────────────────────────────────── */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {userProfile && (
        <ProfilePanel
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          profile={userProfile}
          progressData={progressData}
          onSaved={handleProfileSaved}
        />
      )}

      <WeightLogModal
        isOpen={weightOpen}
        onClose={() => setWeightOpen(false)}
        lastWeight={latestWeight ?? userProfile?.weightKg}
        onSaved={handleWeightSaved}
      />
    </div>
  );
}
