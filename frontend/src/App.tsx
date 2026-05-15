import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { getProfile } from './lib/api';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';

export default function App() {
  const [session,    setSession]    = useState<Session | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // ── Initial load ─────────────────────────────────────────────────────────
    // getSession() reads from local storage — fast, no network call.
    // If a session exists we do one profile check to pick the right screen.
    // setLoading(false) is guaranteed to run via .finally(), so we never
    // get stuck on the loading spinner regardless of what the backend returns.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
        return;
      }
      getProfile()
        .then(() => setHasProfile(true))
        .catch(() => setHasProfile(false)) // 404 → no profile yet → show onboarding
        .finally(() => setLoading(false));
    });

    // ── Subsequent auth events ────────────────────────────────────────────────
    // We only react to SIGNED_IN / SIGNED_OUT here — NOT to TOKEN_REFRESHED or
    // INITIAL_SESSION, which would re-enter the loading state unnecessarily.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);

        if (event === 'SIGNED_IN') {
          // User just logged in — check for a profile without blocking the UI
          getProfile()
            .then(() => setHasProfile(true))
            .catch(() => setHasProfile(false));
        }

        if (event === 'SIGNED_OUT') {
          setHasProfile(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!session)    return <Auth />;
  if (!hasProfile) return <Onboarding onComplete={() => setHasProfile(true)} />;
  return <Dashboard />;
}
