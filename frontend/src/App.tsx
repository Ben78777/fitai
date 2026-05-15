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
    // On first load: get the active session, then check for a profile if one exists.
    // We keep loading=true until both checks are done so there is no flash.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        await checkProfile();
      }
      setLoading(false);
    });

    // React to login / logout events after the initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setLoading(true);
          setSession(session);
          await checkProfile();
          setLoading(false);
        } else {
          setSession(null);
          setHasProfile(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkProfile() {
    try {
      await getProfile();
      setHasProfile(true);
    } catch {
      // 404 means no profile yet — show onboarding
      setHasProfile(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!session) return <Auth />;
  if (!hasProfile) return <Onboarding onComplete={() => setHasProfile(true)} />;
  return <Dashboard />;
}
