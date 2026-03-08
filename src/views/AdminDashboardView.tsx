import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AdminDashboardViewProps {
    readOnly?: boolean;
}

export default function AdminDashboardView({ readOnly = false }: AdminDashboardViewProps) {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeams: 0,
        submissions: 0
    });
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
    const [rejectedUsers, setRejectedUsers] = useState<any[]>([]);
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeList, setActiveList] = useState<'students' | 'teams' | null>(null);

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

        // Fetch approved users (excluding master admin)
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('status', 'approved')
            .neq('email', 'managerproapp@gmail.com')
            .order('full_name', { ascending: true });

        if (userError) console.error("Error fetching users:", userError);
        else setApprovedUsers(users || []);

        // Fetch rejected users
        const { data: rejected, error: rejError } = await supabase
            .from('profiles')
            .select('*')
            .eq('status', 'rejected')
            .order('updated_at', { ascending: false });

        if (rejError) console.error("Error fetching rejected:", rejError);
        else setRejectedUsers(rejected || []);

        // Fetch all teams
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('*, profiles(count)')
            .order('name', { ascending: true });

        if (teamsError) console.error("Error fetching teams list:", teamsError);
        else setAllTeams(teams || []);

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

    const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected', newRole?: string) => {
        const updates: any = { status: newStatus };
        if (newRole) updates.rol = newRole;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            fetchData();
        }
    };

    const handleDownloadBackup = async () => {
        try {
            const tables = ['profiles', 'teams', 'tasks', 'platos', 'user_suggestions', 'task_permissions', 'config'];
            const backupData: any = {};

            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*');
                if (error) console.error(`Error backup ${table}:`, error);
                else backupData[table] = data;
            }

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert("Error al generar copia de seguridad");
        }
    };

    const handleNuclearReset = async () => {
        const confirm1 = window.confirm("⚠️ ATENCIÓN: Estás a punto de borrar TODOS los datos del sistema (equipos, platos, tareas, mensajes). ¿Estás seguro?");
        if (!confirm1) return;

        const confirm2 = window.prompt("Para confirmar esta acción DESTRUCTIVA, escribe 'RESETEAR TODO' en mayúsculas:");
        if (confirm2 !== 'RESETEAR TODO') {
            alert("Confirmación incorrecta. Operación cancelada.");
            return;
        }

        setLoading(true);
        try {
            // Borrado en cascada (tablas hijas primero)
            await supabase.from('task_permissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('user_suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('platos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // Perfiles (excepto admin)
            await supabase.from('profiles').delete().neq('email', 'managerproapp@gmail.com');

            // Equipos (ahora que no hay perfiles asociados que no sean admin)
            await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            alert("✅ Sistema reseteado correctamente. Solo queda tu cuenta de administrador.");
            fetchData();
        } catch (err: any) {
            alert("Error durante el reseteo: " + err.message);
        } finally {
            setLoading(false);
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
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black mb-2 tracking-tight">Visión General</h2>
                        <p className="text-gray-500 font-medium">Gestión dinámica de alumnos y brigadas 2026/27</p>
                    </div>

                    {!readOnly && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleDownloadBackup}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                                title="Descargar Backup Completo (JSON)"
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">💾</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Backup</span>
                            </button>
                            <button
                                onClick={handleNuclearReset}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all group"
                                title="Reseteo Nuclear del Sistema"
                            >
                                <span className="text-xl group-hover:animate-pulse">☢️</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 group-hover:text-rose-300">Reset</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <button
                        onClick={() => setActiveList(activeList === 'students' ? null : 'students')}
                        className={`text-left group transition-all duration-300 rounded-3xl p-8 border ${activeList === 'students' ? 'bg-emerald-500/20 border-emerald-500 scale-[1.02]' : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:scale-[1.02]'}`}
                    >
                        <div className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between">
                            Alumnos Activos
                            <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">{activeList === 'students' ? 'Ocultar' : 'Ver Lista'}</span>
                        </div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                        ) : (
                            <div className="text-5xl font-black">{stats.totalStudents}</div>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveList(activeList === 'teams' ? null : 'teams')}
                        className={`text-left group transition-all duration-300 rounded-3xl p-8 border ${activeList === 'teams' ? 'bg-blue-500/20 border-blue-500 scale-[1.02]' : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 hover:scale-[1.02]'}`}
                    >
                        <div className="text-blue-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between">
                            Brigadas (Equipos)
                            <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full">{activeList === 'teams' ? 'Ocultar' : 'Ver Lista'}</span>
                        </div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-400 rounded-full animate-spin" />
                        ) : (
                            <div className="text-5xl font-black">{stats.totalTeams}</div>
                        )}
                    </button>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 transition-all hover:bg-amber-500/10 hover:scale-[1.02] duration-300">
                        <div className="text-amber-400 text-xs font-black uppercase tracking-widest mb-3">Tareas Registradas</div>
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                        ) : (
                            <div className="text-5xl font-black">{stats.submissions}</div>
                        )}
                    </div>
                </div>

                {/* Detailed Lists (Conditional) */}
                {activeList === 'students' && (
                    <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm">
                            <h3 className="text-2xl font-black mb-6">Listado Completo de Alumnos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {approvedUsers.map(user => (
                                    <div key={user.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 font-black">
                                            {user.full_name?.substring(0, 1).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight">{user.full_name}</p>
                                            <p className="text-[10px] text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeList === 'teams' && (
                    <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm">
                            <h3 className="text-2xl font-black mb-6">Listado de Brigadas (Equipos)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {allTeams.map(team => (
                                    <div key={team.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-black text-lg text-white">{team.name}</h4>
                                            <span className="text-[10px] font-black px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full uppercase tracking-tighter">
                                                CÓDIGO: {team.invite_code}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-xs text-gray-400">
                                            <p className="flex justify-between">
                                                <span>Integrantes:</span>
                                                <span className="text-white font-bold">{team.profiles?.[0]?.count || 0} alumnos</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span>Estado:</span>
                                                <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">{team.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

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
                                            {!readOnly && (
                                                <div className="flex flex-col gap-2">
                                                    <select
                                                        id={`role-${req.id}`}
                                                        className="bg-gray-800 border border-white/10 rounded-lg text-[10px] px-2 py-1 text-gray-300 focus:outline-none focus:border-emerald-500"
                                                        defaultValue={req.rol || 'alumno'}
                                                    >
                                                        <option value="alumno">Alumno</option>
                                                        <option value="invitado">Profe Complementario</option>
                                                    </select>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/20 transition-all"
                                                        >
                                                            Denegar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const sel = document.getElementById(`role-${req.id}`) as HTMLSelectElement;
                                                                handleUpdateStatus(req.id, 'approved', sel.value);
                                                            }}
                                                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10"
                                                        >
                                                            Aceptar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Rejected Users Management */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm opacity-60 hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-white/50">Usuarios Denegados / Expulsados</h3>
                                    <p className="text-gray-600 text-[10px] font-medium mt-1">Usuarios sin acceso al sistema</p>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {rejectedUsers.length === 0 ? (
                                    <p className="text-center py-6 text-gray-700 text-[10px] italic">No hay usuarios denegados</p>
                                ) : (
                                    rejectedUsers.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl group">
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400">{user.full_name}</div>
                                                <div className="text-[9px] text-gray-600">{user.email}</div>
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    onClick={() => handleUpdateStatus(user.id, 'approved', user.rol || 'alumno')}
                                                    className="px-3 py-1 bg-white/5 hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-lg border border-white/5 transition-all"
                                                >
                                                    Rehabilitar
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Final Unified Workflow Info (Simplified) */}
                        <div className="bg-gradient-to-br from-blue-600/20 to-emerald-600/20 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-500">🛡️</div>
                            <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                                Resumen de Flujo
                            </h3>
                            <div className="space-y-4 text-sm text-gray-400 font-medium leading-relaxed">
                                <p className="flex items-start gap-3">
                                    <span className="text-emerald-400 font-bold">1.</span>
                                    <span>Nuevos usuarios aparecen como <span className="text-amber-400">pendientes</span>.</span>
                                </p>
                                <p className="flex items-start gap-3">
                                    <span className="text-emerald-400 font-bold">2.</span>
                                    <span>Tú les asignas el rol (**Alumno** o **Invitado**) al aprobarlos.</span>
                                </p>
                            </div>
                        </div>

                        {/* Approved Users Management */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-white">Usuarios Activos</h3>
                                    <p className="text-gray-500 text-sm font-medium mt-1">Gestión de roles y acceso</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {approvedUsers.length === 0 ? (
                                    <p className="text-center py-10 text-gray-600 text-sm italic">No hay otros usuarios activos</p>
                                ) : (
                                    approvedUsers.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl group">
                                            <div>
                                                <div className="text-xs font-black text-white">{user.full_name}</div>
                                                <div className="text-[10px] text-gray-500">{user.email}</div>
                                                <div className="mt-1 inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-white/10 text-gray-400">
                                                    {user.rol === 'invitado' ? '👀 Profe Complementario' : '🎓 Alumno'}
                                                </div>
                                            </div>
                                            {!readOnly && (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        onChange={(e) => handleUpdateStatus(user.id, 'approved', e.target.value)}
                                                        className="bg-transparent border border-white/10 rounded px-2 py-1 text-[9px] text-gray-400 hover:border-white/20 outline-none"
                                                        value={user.rol || 'alumno'}
                                                    >
                                                        <option value="alumno">Alumno</option>
                                                        <option value="invitado">Invitado</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                                        className="p-2 hover:bg-rose-500/20 text-rose-500/40 hover:text-rose-500 transition-colors rounded-lg"
                                                        title="Revocar acceso"
                                                    >
                                                        🚫
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
