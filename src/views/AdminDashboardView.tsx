import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboardView() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeams: 0,
        submissions: 0
    });
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        // Fetch stats
        const { count: studentCount, error: err1 } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('rol', 'alumno').eq('status', 'approved');
        const { count: teamCount, error: err2 } = await supabase.from('teams').select('*', { count: 'exact', head: true });
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });

        if (err1) console.error("Error fetching students:", err1);
        if (err2) console.error("Error fetching teams:", err2);

        setStats({
            totalStudents: studentCount || 0,
            totalTeams: teamCount || 0,
            submissions: taskCount || 0
        });

        // Fetch pending requests
        const { data: requests, error: reqError } = await supabase
            .from('profiles')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (reqError) console.error("Error fetching requests:", reqError);
        else setPendingRequests(requests || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // Subscripción en tiempo real para nuevas solicitudes
        const channel = supabase
            .channel('pending-profiles')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles'
                },
                (payload) => {
                    console.log("Cambio en perfiles detectado:", payload);
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', userId);

        if (error) {
            alert("Error al actualizar estado: " + error.message);
        } else {
            fetchData();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <header className="border-b border-white/5 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="https://lh3.googleusercontent.com/d/1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e" alt="Manager Pro App" className="h-8 w-auto object-contain" />
                        <div>
                            <h1 className="font-bold text-sm">Panel de Control General</h1>
                            <p className="text-emerald-400 text-[10px] uppercase tracking-wider font-extrabold">FP Cocina · IES La Flota</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors border border-white/10">
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h2 className="text-4xl font-black mb-2 tracking-tight">Visión General</h2>
                    <p className="text-gray-500 font-medium">Gestión dinámica de alumnos y brigadas 2026/27</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 transition-all hover:bg-emerald-500/10 hover:scale-[1.02] duration-300">
                        <div className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-3">Alumnos Activos</div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                        ) : (
                            <div className="text-5xl font-black">{stats.totalStudents}</div>
                        )}
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-8 transition-all hover:bg-blue-500/10 hover:scale-[1.02] duration-300">
                        <div className="text-blue-400 text-xs font-black uppercase tracking-widest mb-3">Brigadas (Equipos)</div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-400 rounded-full animate-spin" />
                        ) : (
                            <div className="text-5xl font-black">{stats.totalTeams}</div>
                        )}
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 transition-all hover:bg-amber-500/10 hover:scale-[1.02] duration-300">
                        <div className="text-amber-400 text-xs font-black uppercase tracking-widest mb-3">Tareas Registradas</div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                        ) : (
                            <div className="text-5xl font-black">{stats.submissions}</div>
                        )}
                    </div>
                </div>

                {/* Access Requests Management */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-white">Solicitudes de Acceso</h3>
                                <p className="text-gray-500 text-sm font-medium mt-1">Alumnos esperando vuestra aprobación</p>
                            </div>
                            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black px-4 py-2 rounded-full border border-amber-500/30 uppercase tracking-widest">
                                {pendingRequests.length} pendientes
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-16 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                                    <div className="text-4xl mb-4 opacity-20">📜</div>
                                    <p className="text-gray-500 font-medium italic">No hay solicitudes pendientes en este momento</p>
                                </div>
                            ) : (
                                pendingRequests.map((req) => (
                                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/[0.08] transition-all group gap-4">
                                        <div>
                                            <div className="text-sm font-black text-white mb-1">{req.full_name || 'Sin nombre'}</div>
                                            <div className="text-xs font-medium text-gray-500 group-hover:text-gray-400 transition-colors">{req.email}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/20 transition-all"
                                            >
                                                Denegar
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10"
                                            >
                                                Aceptar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-blue-600/20 to-emerald-600/20 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-500">🛡️</div>
                            <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                                Nuevo Sistema de Flujo
                            </h3>
                            <div className="space-y-4 text-sm text-gray-400 font-medium leading-relaxed">
                                <p className="flex items-start gap-3">
                                    <span className="text-emerald-400 font-bold">1.</span>
                                    <span>Los alumnos inician sesión con Google.</span>
                                </p>
                                <p className="flex items-start gap-3">
                                    <span className="text-emerald-400 font-bold">2.</span>
                                    <span>Su perfil aparece aquí como <span className="text-amber-400">pendiente</span>.</span>
                                </p>
                                <p className="flex items-start gap-3">
                                    <span className="text-emerald-400 font-bold">3.</span>
                                    <span>Tú revisas su nombre y correo antes de autorizarles.</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 border-dashed flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="font-black text-lg mb-2 text-white">Próximamente: Vista de Brigada</h3>
                            <p className="text-gray-500 text-xs font-medium max-w-[250px] mx-auto">Podrás entrar en tiempo real a ver el progreso de cada restaurante.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
