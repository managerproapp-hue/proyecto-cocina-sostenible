import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import LandingView from './views/LandingView';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import OnboardingView from './views/OnboardingView';
import BrigadaFichaView from './views/BrigadaFichaView';
import AdminDashboardView from './views/AdminDashboardView';
import MaintenanceView from './views/MaintenanceView';
import WaitingApprovalView from './views/WaitingApprovalView';
import { ZONAS_MURCIA } from './data/zonas';
import type { Session } from '@supabase/supabase-js';

type View = 'landing' | 'onboarding' | 'brigada-ficha' | 'dashboard' | 'admin-dashboard' | 'waiting-approval' | 'unauthorized' | 'invitado-dashboard' | 'maintenance';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);

  const fetchProfile = async (userId: string, userEmail: string | undefined, currentSession: any) => {
    try {
      console.log("Fetching profile for:", userEmail);
      const isAdmin = userEmail === 'managerproapp@gmail.com';

      // 1. Get Profile
      let { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Profile Fetch Error:", fetchError);
      }

      // 2. Create if not exists
      if (!profile) {
        console.log("Profile not found. Creating...");
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
          console.error("Profile Insert Error:", insertError);
          // If inserting into DB fails, we show the restricted screen with the error
          if (!isAdmin) {
            alert("⚠️ Error en base de datos: " + insertError.message + "\nCódigo: " + insertError.code);
            setCurrentView('unauthorized');
            setLoading(false);
            return;
          }
          if (isAdmin) {
            profile = { id: userId, email: userEmail, rol: 'admin', status: 'approved' };
          }
        } else {
          profile = newProfile;
          console.log("Profile created successfully");
        }
      }

      setUserProfile(profile);

      // 3. Routing
      if (profile?.rol === 'admin' || isAdmin) {
        setCurrentView('admin-dashboard');
      } else if (profile?.rol === 'invitado') {
        setCurrentView('invitado-dashboard');
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
      console.error("System Crash:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial Session
    const init = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      if (initialSession) {
        fetchProfile(initialSession.user.id, initialSession.user.email, initialSession);
      } else {
        setLoading(false);
      }
    };
    init();

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth Event:", event);
      setSession(newSession);
      if (newSession) {
        setLoading(true); // Always show loading when session changes
        fetchProfile(newSession.user.id, newSession.user.email, newSession);
      } else {
        setUserProfile(null);
        setCurrentView('landing');
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
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Iniciando sesión segura...</p>
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
          <div className="max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
            <div className="text-7xl mb-8">🚫</div>
            <h1 className="text-3xl font-black mb-4 text-white">Acceso Denegado</h1>
            <p className="text-gray-400 mb-8 leading-relaxed text-sm">
              Tu cuenta <span className="text-white font-bold">{session.user.email}</span> no ha podido autorizarse.
              <br /><br />
              Dile al profesor que revise si hay un error en la base de datos (Trigger/RLS).
            </p>
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] transition-all"
            >
              Volver al inicio
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
            teamId={userProfile?.team_id}
            isCreator={userProfile?.rol === 'admin' || userProfile?.id === userProfile?.teams?.creator_id}
            onComplete={() => fetchProfile(session.user.id, session.user.email, session)}
          />
        );
      case 'admin-dashboard':
        return <AdminDashboardView
          onEnterMaintenance={() => setCurrentView('maintenance')}
          onImpersonate={(user: any) => {
            setImpersonatedUser(user);
            setCurrentView('dashboard');
          }}
        />;
      case 'invitado-dashboard':
        return <AdminDashboardView readOnly={true} />;
      case 'maintenance':
        if (userProfile?.email !== 'managerproapp@gmail.com') {
          setCurrentView('admin-dashboard');
          return null;
        }
        return <MaintenanceView onBack={() => setCurrentView('admin-dashboard')} />;
      case 'dashboard':
        return (
          <DashboardView
            userProfile={impersonatedUser || userProfile}
            isImpersonated={!!impersonatedUser}
            zone={(impersonatedUser || userProfile)?.teams?.zone_id ? ZONAS_MURCIA.find(z => z.id === (impersonatedUser || userProfile).teams.zone_id) || null : null}
            onChangeZone={() => setCurrentView('onboarding')}
            onOpenFicha={() => setCurrentView('brigada-ficha')}
          />
        );
      default:
        // By default, show LandingView but if we are here we are logged in.
        // If not admin and not pending, maybe we need onboarding.
        return <LandingView onStart={() => setCurrentView('onboarding')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {impersonatedUser && (
        <div className="bg-amber-500 text-gray-950 px-6 py-2 flex items-center justify-between sticky top-0 z-[100] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg">🕵️</span>
            <span>MODO AYUDA: Visualizando a <span className="underline decoration-2">{impersonatedUser.full_name}</span></span>
          </div>
          <button
            onClick={() => {
              setImpersonatedUser(null);
              setCurrentView('admin-dashboard');
            }}
            className="bg-gray-950 text-white px-4 py-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            Volver al Panel Admin
          </button>
        </div>
      )}
      {renderView()}

      {/* Debug Footer (Only if session exists) */}
      {session && (
        <div className="fixed bottom-4 right-4 text-[8px] text-gray-700 font-mono opacity-50 hover:opacity-100 transition-opacity">
          USER: {session.user.email} | VIEW: {currentView} | PROFILE: {userProfile ? 'OK' : 'MISSING'}
        </div>
      )}
    </div>
  );
}

export default App;
