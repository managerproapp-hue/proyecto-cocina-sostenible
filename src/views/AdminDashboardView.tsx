import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AdminDashboardViewProps {
    readOnly?: boolean;
    onEnterMaintenance?: () => void;
    onImpersonate?: (user: any) => void;
}

export default function AdminDashboardView({ readOnly = false, onEnterMaintenance, onImpersonate }: AdminDashboardViewProps) {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeams: 0,
        submissions: 0
    });
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [activeList, setActiveList] = useState<'students' | 'teams' | null>(null);

    const fetchData = async () => {
        const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('rol', 'alumno').eq('status', 'approved');
        const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });

        setStats({
            totalStudents: studentCount || 0,
            totalTeams: teamCount || 0,
            submissions: taskCount || 0
        });

        const { data: requests } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false });
        setPendingRequests(requests || []);

        const { data: users } = await supabase.from('profiles').select('*').eq('status', 'approved').neq('email', 'managerproapp@gmail.com').order('full_name', { ascending: true });
        setApprovedUsers(users || []);

        const { data: teams } = await supabase.from('teams').select('*, profiles(count)').order('name', { ascending: true });
        setAllTeams(teams || []);
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('pending-profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData()).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected', newRole?: string) => {
        const updates: any = { status: newStatus };
        if (newRole) updates.rol = newRole;
        const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
        if (error) alert("Error: " + error.message);
        else fetchData();
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
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black mb-2 tracking-tight">Visión General</h2>
                        <p className="text-gray-500 font-medium">Gestión dinámica de alumnos y brigadas 2026/27</p>
                    </div>

                    {!readOnly && (
                        <div className="flex gap-4 p-2 bg-rose-500/10 rounded-[2rem] border border-rose-500/20 shadow-[0_8px_0_0_rgba(159,18,57,1)] active:translate-y-1 active:shadow-none transition-all">
                            <button
                                onClick={onEnterMaintenance}
                                className="flex items-center gap-6 px-10 py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-[1.5rem] transition-all group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-rose-900/20 to-transparent pointer-events-none" />
                                <span className="text-4xl group-hover:scale-110 transition-transform drop-shadow-lg">🛡️</span>
                                <div className="text-left relative z-10">
                                    <div className="text-sm font-black uppercase tracking-[0.25em] drop-shadow-md">Zona de Seguridad</div>
                                    <div className="text-[11px] text-white/80 font-bold uppercase tracking-widest">Mantenimiento y Respaldo</div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <button
                        onClick={() => setActiveList(activeList === 'students' ? null : 'students')}
                        className={`text-left group transition-all duration-300 rounded-3xl p-8 border ${activeList === 'students' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'}`}
                    >
                        <div className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between">
                            Alumnos Activos
                            <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">{activeList === 'students' ? 'Ocultar' : 'Ver'}</span>
                        </div>
                        <div className="text-5xl font-black">{stats.totalStudents}</div>
                    </button>

                    <button
                        onClick={() => setActiveList(activeList === 'teams' ? null : 'teams')}
                        className={`text-left group transition-all duration-300 rounded-3xl p-8 border ${activeList === 'teams' ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'}`}
                    >
                        <div className="text-blue-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between">
                            Brigadas
                            <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full">{activeList === 'teams' ? 'Ocultar' : 'Ver'}</span>
                        </div>
                        <div className="text-5xl font-black">{stats.totalTeams}</div>
                    </button>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 transition-all">
                        <div className="text-amber-400 text-xs font-black uppercase tracking-widest mb-3">Progreso Global</div>
                        <div className="text-5xl font-black">{stats.submissions}</div>
                    </div>
                </div>

                {activeList === 'students' && (
                    <div className="mb-12 p-8 bg-white/5 border border-white/10 rounded-3xl animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-xl font-bold mb-6">Listado de Alumnos</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {approvedUsers.map(user => (
                                <div key={user.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-sm tracking-tight">{user.full_name}</div>
                                        <div className="text-[10px] text-gray-500 font-medium">{user.email}</div>
                                    </div>
                                    <button
                                        onClick={() => onImpersonate?.(user)}
                                        className="text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_4px_0_0_rgba(29,78,216,1)] active:shadow-none active:translate-y-1 flex items-center gap-2"
                                    >
                                        <span className="text-sm">👁️</span>
                                        SUPLANTAR (MODO AYUDA)
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeList === 'teams' && (
                    <div className="mb-12 p-8 bg-white/5 border border-white/10 rounded-3xl animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-xl font-bold mb-6">Listado de Brigadas</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allTeams.map(team => (
                                <div key={team.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-black text-sm uppercase tracking-tight text-white mb-1">{team.name}</div>
                                            <div className="text-[10px] text-emerald-500/70 font-black tracking-[0.2em]">{team.invite_code}</div>
                                        </div>
                                        <div className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-blue-500/30">
                                            {team.profiles?.[0]?.count || 0} Integrantes
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Acceso Rápido:</p>
                                        <button
                                            onClick={async () => {
                                                const { data: members } = await supabase.from('profiles').select('*').eq('team_id', team.id).limit(1);
                                                if (members && members[0]) onImpersonate?.(members[0]);
                                                else alert("Esta brigada no tiene integrantes todavía");
                                            }}
                                            className="w-full text-center py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-blue-400 transition-all"
                                        >
                                            👁️ Ver Proyecto Grupal
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h3 className="text-xl font-black mb-6">Solicitudes Pendientes</h3>
                        <div className="space-y-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-4">
                                    <div>
                                        <div className="font-bold text-sm">{req.full_name || 'Nuevo Alumno'}</div>
                                        <div className="text-xs text-gray-500">{req.email}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            id={`role-${req.id}`}
                                            className="bg-gray-800 border border-white/10 rounded-lg text-[10px] px-2 py-1"
                                            defaultValue="alumno"
                                        >
                                            <option value="alumno">Alumno</option>
                                            <option value="invitado">Invitado</option>
                                        </select>
                                        <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-lg border border-rose-500/20">Rechazar</button>
                                        <button
                                            onClick={() => {
                                                const sel = document.getElementById(`role-${req.id}`) as HTMLSelectElement;
                                                handleUpdateStatus(req.id, 'approved', sel.value);
                                            }}
                                            className="px-4 py-1 bg-emerald-500 text-gray-950 text-[10px] font-bold rounded-lg"
                                        >
                                            Aprobar
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendingRequests.length === 0 && <p className="text-center text-gray-600 italic text-sm py-10">No hay solicitudes pendientes</p>}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h3 className="text-xl font-black mb-6">Gestión de Usuarios Activos</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {approvedUsers.map(user => (
                                <div key={user.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-xs">{user.full_name}</div>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest ${user.rol === 'invitado' ? 'text-blue-400' : 'text-gray-500'}`}>
                                            {user.rol === 'invitado' ? 'Invitado' : 'Alumno'}
                                        </div>
                                    </div>
                                    <button onClick={() => handleUpdateStatus(user.id, 'rejected')} className="text-gray-700 hover:text-rose-500 transition-colors">🚫</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
