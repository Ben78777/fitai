import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getLog } from '../lib/api';
import MacroSummary from './MacroSummary';
import DailyLog from './DailyLog';
import type { LogEntry } from '../types';

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLog() {
    try {
      const data = await getLog(today);
      setEntries(data);
    } catch {
      // Log fetch errors silently — user still sees the empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLog();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    // App.tsx session listener will redirect to Auth screen
  }

  // Format today's date in a readable way
  const displayDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">FitAI</h1>
            <p className="text-xs text-gray-500">{displayDate}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : (
          <>
            <MacroSummary entries={entries} />
            <DailyLog entries={entries} date={today} onRefresh={fetchLog} />
          </>
        )}
      </main>
    </div>
  );
}
