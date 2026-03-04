import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import LandingView from './views/LandingView';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import OnboardingView from './views/OnboardingView';
import BrigadaFichaView from './views/BrigadaFichaView';
import { ZONAS_MURCIA } from './data/zonas';
import type { Zone } from './types';
import type { Session } from '@supabase/supabase-js';

type View = 'landing' | 'onboarding' | 'brigada-ficha' | 'dashboard' | 'unauthorized' | 'role-selection';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchProfile = async (userId: string) => {
    // 1. Check Whitelist
    const { data: whitelist } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', session?.user?.email)
      .single();

    if (!whitelist && session?.user?.email !== 'jcbprofesor@gmail.com') { // Hardcoded admin check as fallback
      setCurrentView('unauthorized');
      return;
    }

    // 2. Get/Create Profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*, teams(*)')
      .eq('id', userId)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: session?.user?.email,
          full_name: session?.user?.user_metadata?.full_name
        })
        .select()
        .single();
      profile = newProfile;
    }

    setUserProfile(profile);

    if (profile?.rol === 'admin') {
      setCurrentView('dashboard');
    } else if (!profile?.team_id) {
      setCurrentView('onboarding');
    } else if (!profile?.brigada_role || !profile?.has_signed_commitment) {
      setCurrentView('brigada-ficha');
    } else {
      setCurrentView('dashboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleZoneSelected = (zone: Zone) => {
    setSelectedZone(zone);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Cargando plataforma...</p>
          </div>
        </div>
      );
    }

    if (!session) {
      return <LoginView />;
    }

    if (currentView === 'unauthorized') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-8 text-center">
          <div className="max-w-md">
            <div className="text-6xl mb-6">🚫</div>
            <h1 className="text-3xl font-black mb-4 text-rose-500">Acceso No Autorizado</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Tu correo <span className="text-white font-bold">{session.user.email}</span> no está en la lista blanca del profesor. Contacta con él para que te dé acceso.
            </p>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'landing':
        return <LandingView onStart={() => setCurrentView('onboarding')} />;
      case 'onboarding':
        return (
          <OnboardingView
            userId={session.user.id}
            userEmail={session.user.email || ''}
            onComplete={() => fetchProfile(session.user.id)}
          />
        );
      case 'brigada-ficha':
        return (
          <BrigadaFichaView
            userId={session.user.id}
            teamId={userProfile?.team_id}
            onComplete={() => fetchProfile(session.user.id)}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            zone={userProfile?.teams?.zone_id ? ZONAS_MURCIA.find(z => z.id === userProfile.teams.zone_id) || null : null}
            onChangeZone={() => setCurrentView('onboarding')}
          />
        );
      default:
        return <LandingView onStart={() => setCurrentView('onboarding')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {renderView()}
    </div>
  );
}

export default App;
