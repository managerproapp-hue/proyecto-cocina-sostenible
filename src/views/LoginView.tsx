import { supabase } from '../lib/supabaseClient';

export default function LoginView() {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) console.error('Error logging in:', error.message);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gray-950">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-emerald-950/20 to-gray-950 z-0" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

            <div className="relative z-10 w-full max-w-md px-8 py-12 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-2xl text-center">
                {/* Logos Container */}
                <div className="flex justify-center items-center gap-6 mb-10">
                    <img
                        src="https://lh3.googleusercontent.com/d/1nu2fOvKoWMIKGehqtjLjpcjuqiyMSR8A"
                        alt="IES La Flota"
                        className="h-16 w-auto object-contain drop-shadow-lg"
                    />
                    <div className="h-10 w-px bg-white/10" />
                    <img
                        src="https://lh3.googleusercontent.com/d/1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e"
                        alt="jcbprofesor"
                        className="h-12 w-auto object-contain opacity-80"
                    />
                </div>

                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                    Acceso Plataforma
                </h1>
                <p className="text-gray-400 text-sm mb-10">
                    Proyecto Intermodular · Carta Sostenible 2026/27
                </p>

                {/* Info Card */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-10 text-left">
                    <div className="flex gap-3">
                        <span className="text-emerald-400">🛡️</span>
                        <div>
                            <p className="text-white text-xs font-bold uppercase mb-1">Acceso Restringido</p>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                                Solo usuarios autorizados en la lista blanca del profesor pueden acceder a los datos del proyecto.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="group w-full flex items-center justify-center gap-4 bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-white/10 hover:-translate-y-1 active:translate-y-0"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Entrar con Google
                </button>

                <p className="mt-10 text-gray-600 text-[10px] uppercase tracking-widest font-bold">
                    IES La Flota de Murcia · Formación Profesional
                </p>
            </div>

            {/* Footer Decoration */}
            <div className="absolute bottom-8 text-gray-700 text-[10px] z-10">
                © 2026 Plataforma de Gestión de Proyectos Culinarios
            </div>
        </div>
    );
}
