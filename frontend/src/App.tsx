import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { getProfile } from './lib/api';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-7 h-7 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [session,          setSession]          = useState<Session | null>(null);
  const [loading,          setLoading]          = useState(true);
  // Separate flag for the SIGNED_IN path — prevents onboarding flash for existing users
  const [profileChecking,  setProfileChecking]  = useState(false);
  const [hasProfile,       setHasProfile]       = useState(false);

  useEffect(() => {
    // ── Initial load ─────────────────────────────────────────────────────────
    // getSession() reads from local storage — fast, no network call.
    // We hold the loading spinner until the profile check completes so the
    // user never sees onboarding for a split second.
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
        if (event === 'SIGNED_IN') {
          setSession(newSession);
          // Block rendering until we know whether the profile exists —
          // without this guard, hasProfile=false would flash Onboarding.
          setProfileChecking(true);
          getProfile()
            .then(() => setHasProfile(true))
            .catch(() => setHasProfile(false))
            .finally(() => setProfileChecking(false));
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setHasProfile(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading || profileChecking) return <Spinner />;

  if (!session)    return <Auth />;
  if (!hasProfile) return <Onboarding onComplete={() => setHasProfile(true)} />;
  return <Dashboard />;
}
