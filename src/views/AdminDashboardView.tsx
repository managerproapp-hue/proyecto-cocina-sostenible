import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboardView() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeams: 0,
        submissions: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const { data: students, count: studentCount, error: err1 } = await supabase.from('profiles').select('*', { count: 'exact', head: false }).eq('rol', 'alumno');
            const { data: teams, count: teamCount, error: err2 } = await supabase.from('teams').select('*', { count: 'exact', head: false });
            const { count: taskCount, error: err3 } = await supabase.from('tasks').select('*', { count: 'exact', head: true });

            if (err1) alert("Error fetching students: " + JSON.stringify(err1));
            if (err2) alert("Error fetching teams: " + JSON.stringify(err2));

            console.log("Students data:", students);
            console.log("Teams data:", teams);

            setStats({
                totalStudents: studentCount || 0,
                totalTeams: teamCount || 0,
                submissions: taskCount || 0
            });
        };
        fetchStats();
    }, []);

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
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                        <div className="text-emerald-500 text-sm font-bold uppercase mb-2">Alumnos Registrados</div>
                        <div className="text-4xl font-black">{stats.totalStudents}</div>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                        <div className="text-blue-500 text-sm font-bold uppercase mb-2">Brigadas (Equipos)</div>
                        <div className="text-4xl font-black">{stats.totalTeams}</div>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                        <div className="text-amber-500 text-sm font-bold uppercase mb-2">Entregas Activas</div>
                        <div className="text-4xl font-black">{stats.submissions}</div>
                    </div>
                </div>

                <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <div className="text-4xl mb-4">⚙️</div>
                    <h3 className="font-bold mb-2">Gestión en construcción</h3>
                    <p className="text-gray-500 text-sm">Próximamente: Shadow Mode, Auditoría de acciones y Control de Fases.</p>
                </div>
            </main>
        </div>
    );
}
