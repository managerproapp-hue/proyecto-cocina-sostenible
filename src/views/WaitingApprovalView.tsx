import { supabase } from '../lib/supabaseClient';

export default function WaitingApprovalView() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-8 text-center">
            <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-12 shadow-2xl">
                <div className="text-6xl mb-8 animate-pulse">⏳</div>
                <h1 className="text-3xl font-black mb-4 text-amber-400">Solicitud Pendiente</h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Tu acceso está siendo revisado por el profesor.
                    <br /><br />
                    Vuelve a intentar en unos minutos o contacta con el responsable para que active tu cuenta.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                        Comprobar estado
                    </button>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                    >
                        Cerrar Sesión
                    </button>
                </div>
                <p className="mt-10 text-gray-600 text-[10px] uppercase tracking-widest font-bold">
                    IES La Flota de Murcia · FP Cocina
                </p>
            </div>
        </div>
    );
}
