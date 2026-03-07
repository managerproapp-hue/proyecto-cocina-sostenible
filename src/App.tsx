import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import LandingView from './views/LandingView';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import OnboardingView from './views/OnboardingView';
import BrigadaFichaView from './views/BrigadaFichaView';
import AdminDashboardView from './views/AdminDashboardView';
import WaitingApprovalView from './views/WaitingApprovalView';
import { ZONAS_MURCIA } from './data/zonas';
import type { Session } from '@supabase/supabase-js';

type View = 'landing' | 'onboarding' | 'brigada-ficha' | 'dashboard' | 'admin-dashboard' | 'waiting-approval' | 'unauthorized' | 'role-selection';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchProfile = async (userId: string, userEmail: string | undefined, currentSession: any) => {
    try {
      const isAdmin = userEmail === 'managerproapp@gmail.com';

      // 1. Get/Create Profile
      let { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching profile:", fetchError);
      }

      if (!profile) {
        console.log("Creating new profile for:", userEmail);
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            full_name: currentSession?.user?.user_metadata?.full_name || userEmail?.split('@')[0],
            rol: isAdmin ? 'admin' : 'alumno',
            status: isAdmin ? 'approved' : 'pending'
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile mapping", insertError);
          if (!isAdmin) {
            alert("⚠️ Error al registrarse: " + insertError.message);
          }

          if (isAdmin) {
            profile = { id: userId, email: userEmail, rol: 'admin', status: 'approved' };
          } else {
            setCurrentView('unauthorized');
            setLoading(false);
            return;
          }
        } else {
          profile = newProfile;
        }
      }

      setUserProfile(profile);

      // 2. Final Unified Routing Logic
      if (profile?.rol === 'admin') {
        setCurrentView('admin-dashboard');
      } else if (profile?.status === 'pending') {
        setCurrentView('waiting-approval');
      } else if (profile?.status === 'rejected') {
        setCurrentView('unauthorized');
      } else if (!profile?.team_id) {
        setCurrentView('onboarding');
      } else if (!profile?.brigada_role || !profile?.has_signed_commitment) {
        setCurrentView('brigada-ficha');
      } else {
        setCurrentView('dashboard');
      }
    } catch (err: any) {
      console.error("Auth flow crash:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      if (initialSession) {
        fetchProfile(initialSession.user.id, initialSession.user.email, initialSession);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth Event:", event, newSession?.user?.email);
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user.id, newSession.user.email, newSession);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
          <div className="max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-12">
            <div className="text-6xl mb-6">🚫</div>
            <h1 className="text-3xl font-black mb-4 text-rose-500">Acceso No Autorizado</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Tu correo <span className="text-white font-bold">{session.user.email}</span> no está en la lista blanca o ha sido denegado por el profesor.
            </p>
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all font-bold"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'onboarding':
        return (
          <OnboardingView
            userId={session.user.id}
            userEmail={session.user.email || ''}
            onComplete={() => fetchProfile(session.user.id, session.user.email, session)}
          />
        );
      case 'waiting-approval':
        return <WaitingApprovalView />;
      case 'brigada-ficha':
        return (
          <BrigadaFichaView
            userId={session.user.id}
            onComplete={() => fetchProfile(session.user.id, session.user.email, session)}
          />
        );
      case 'admin-dashboard':
        return <AdminDashboardView />;
      case 'dashboard':
        return (
          <DashboardView
            zone={userProfile?.teams?.zone_id ? ZONAS_MURCIA.find(z => z.id === userProfile.teams.zone_id) || null : null}
            onChangeZone={() => setCurrentView('onboarding')}
          />
        );
      default:
        // By default, if approved but no team, go to onboarding
        return (
          <OnboardingView
            userId={session.user.id}
            userEmail={session.user.email || ''}
            onComplete={() => fetchProfile(session.user.id, session.user.email, session)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {renderView()}
    </div>
  );
}

export default App;
