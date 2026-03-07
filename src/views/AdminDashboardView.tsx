import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboardView() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeams: 0,
        submissions: 0
    });
    const [whitelist, setWhitelist] = useState<{ email: string }[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        // Fetch stats
        const { data: students, count: studentCount, error: err1 } = await supabase.from('profiles').select('*', { count: 'exact', head: false }).eq('rol', 'alumno');
        const { data: teams, count: teamCount, error: err2 } = await supabase.from('teams').select('*', { count: 'exact', head: false });
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });

        if (err1) console.error("Error fetching students:", err1);
        if (err2) console.error("Error fetching teams:", err2);

        setStats({
            totalStudents: studentCount || 0,
            totalTeams: teamCount || 0,
            submissions: taskCount || 0
        });

        // Fetch whitelist
        const { data: whitelistData, error: wlError } = await supabase.from('allowed_emails').select('email').order('email', { ascending: true });
        if (wlError) console.error("Error fetching whitelist:", wlError);
        else setWhitelist(whitelistData || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        const { error } = await supabase.from('allowed_emails').insert({ email: newEmail.trim().toLowerCase() });
        if (error) {
            alert("Error al añadir email: " + error.message);
        } else {
            setNewEmail('');
            fetchData();
        }
    };

    const handleRemoveEmail = async (email: string) => {
        if (!confirm(`¿Estás seguro de eliminar ${email} de la lista blanca?`)) return;
        const { error } = await supabase.from('allowed_emails').delete().eq('email', email);
        if (error) {
            alert("Error al eliminar email: " + error.message);
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
                            <p className="text-emerald-500/60 text-[10px] uppercase tracking-wider font-bold">Manager Pro App</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors border border-white/10">
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-black mb-2">Visión General</h2>
                    <p className="text-gray-500">Métricas de la plataforma Carta Sostenible 2026/27</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 transition-all hover:bg-emerald-500/10">
                        <div className="text-emerald-500 text-sm font-bold uppercase mb-2">Alumnos Registrados</div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        ) : (
                            <div className="text-4xl font-black">{stats.totalStudents}</div>
                        )}
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 transition-all hover:bg-blue-500/10">
                        <div className="text-blue-500 text-sm font-bold uppercase mb-2">Brigadas (Equipos)</div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                            <div className="text-4xl font-black">{stats.totalTeams}</div>
                        )}
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 transition-all hover:bg-amber-500/10">
                        <div className="text-amber-500 text-sm font-bold uppercase mb-2">Entregas Activas</div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                        ) : (
                            <div className="text-4xl font-black">{stats.submissions}</div>
                        )}
                    </div>
                </div>

                {/* Whitelist Management */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Gestión de Lista Blanca</h3>
                                <p className="text-gray-500 text-sm">Gestiona quién puede acceder a la plataforma</p>
                            </div>
                            <span className="bg-white/5 text-gray-400 text-xs px-3 py-1 rounded-full border border-white/10">
                                {whitelist.length} correos
                            </span>
                        </div>

                        <form onSubmit={handleAddEmail} className="flex gap-2 mb-8">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="ejemplo@google.com"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Añadir
                            </button>
                        </form>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {whitelist.length === 0 ? (
                                <p className="text-center text-gray-600 py-8 italic">No hay correos en la lista blanca</p>
                            ) : (
                                whitelist.map((item) => (
                                    <div key={item.email} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                                        <span className="text-sm font-medium text-gray-300">{item.email}</span>
                                        <button
                                            onClick={() => handleRemoveEmail(item.email)}
                                            className="text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                                            title="Eliminar de la lista"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="text-emerald-500 text-xl">🛡️</span>
                                Seguridad y RLS
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Las reglas de Row Level Security (RLS) aseguran que los alumnos solo vean sus datos.
                                Si ves contadores a cero, es probable que necesites aplicar el parche SQL de recursión.
                            </p>
                            <div className="bg-gray-900 rounded-xl p-4 font-mono text-[10px] text-gray-400 border border-white/5">
                                -- Parche SQL RLS Master Admin<br />
                                auth.jwt() -{'>'}{'>'} 'email' = 'managerproapp@gmail.com'
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 border-dashed flex flex-col items-center justify-center text-center opacity-60">
                            <div className="text-3xl mb-3">⚙️</div>
                            <h3 className="font-bold mb-1">Próximamente: Shadow Mode</h3>
                            <p className="text-gray-500 text-[11px]">Podrás entrar en los paneles de cada brigada para supervisar y dejar notas.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
