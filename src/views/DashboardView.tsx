import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Zone } from '../types';

interface DashboardViewProps {
    userProfile: any;
    zone: Zone | null;
    isImpersonated?: boolean;
    onChangeZone: () => void;
}

const TASKS = [
    {
        id: 1,
        step: '01',
        title: 'Constitución de la Brigada Digital',
        description: 'Definir los roles del equipo, elegir el nombre de la brigada y justificar la selección de zona.',
        status: 'pending',
        icon: '👥',
        color: 'emerald',
    },
    {
        id: 2,
        step: '02',
        title: 'Investigación de la Zona',
        description: 'Análisis de la competencia, perfil del cliente, mapa de proveedores km0 y catálogo de productos.',
        status: 'pending',
        icon: '🔍',
        color: 'blue',
    },
    {
        id: 3,
        step: '03',
        title: 'Diseño de la Carta',
        description: 'Crear la propuesta gastronómica: aperitivos, entrantes, platos principales y postres sostenibles.',
        status: 'pending',
        icon: '📋',
        color: 'amber',
    },
    {
        id: 4,
        step: '04',
        title: 'Elaboración y Servicio',
        description: 'Puesta en práctica de las recetas diseñadas. Evaluación del servicio y presentación final.',
        status: 'pending',
        icon: '🍽️',
        color: 'rose',
    },
];

export default function DashboardView({ userProfile, zone, isImpersonated = false, onChangeZone }: DashboardViewProps) {
    const colorMap: Record<string, string> = {
        emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
        blue: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
        amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
        rose: 'border-rose-500/30 bg-rose-500/5 text-rose-400',
    };

    const badgeMap: Record<string, string> = {
        emerald: 'bg-emerald-500/10 text-emerald-400',
        blue: 'bg-blue-500/10 text-blue-400',
        amber: 'bg-amber-500/10 text-amber-400',
        rose: 'bg-rose-500/10 text-rose-400',
    };

    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [downloadSelection, setDownloadSelection] = useState({
        perfil: true,
        equipo: true,
        tareas: true,
        platos: true
    });
    const [taskStatuses, setTaskStatuses] = useState<Record<number, string>>({});
    const [lockedTasks, setLockedTasks] = useState<Record<number, boolean>>({});
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [taskContent, setTaskContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            const teamId = userProfile?.team_id;
            if (!teamId) return;

            const { data } = await supabase
                .from('tasks')
                .select('task_number, status, is_locked')
                .eq('team_id', teamId);

            if (data) {
                const statuses: Record<number, string> = {};
                const locks: Record<number, boolean> = {};
                data.forEach((t: any) => {
                    statuses[t.task_number] = t.status;
                    locks[t.task_number] = t.is_locked;
                });
                setTaskStatuses(statuses);
                setLockedTasks(locks);
            }
        };
        fetchTasks();
    }, [userProfile]);

    const handleTaskClick = async (taskId: number) => {
        const task = TASKS.find(t => t.id === taskId);
        if (!task) return;

        const isLocked = lockedTasks[taskId];
        if (isLocked && !isImpersonated) {
            alert("Esta fase está bloqueada. Contacta con el profesor si necesitas modificarla.");
            // We still let them see it, but in read-only mode
        }

        setSelectedTask(task);

        // Fetch existing content
        const { data } = await supabase
            .from('tasks')
            .select('content')
            .eq('team_id', userProfile?.team_id)
            .eq('task_number', taskId)
            .single();

        setTaskContent(data?.content || '');
    };

    const handleSaveTask = async () => {
        if (!selectedTask || !userProfile?.team_id) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .upsert({
                    team_id: userProfile.team_id,
                    task_number: selectedTask.id,
                    content: taskContent,
                    status: 'in_progress',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'team_id,task_number' });

            if (error) throw error;
            setTaskStatuses(prev => ({ ...prev, [selectedTask.id]: 'in_progress' }));
            setSelectedTask(null);
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleLock = async (taskId: number) => {
        if (!isImpersonated) return; // Only admin can lock/unlock manually for now, or maybe students can "finish"

        const newLockState = !lockedTasks[taskId];
        const { error } = await supabase
            .from('tasks')
            .upsert({
                team_id: userProfile?.team_id,
                task_number: taskId,
                is_locked: newLockState,
                updated_at: new Date().toISOString()
            }, { onConflict: 'team_id,task_number' });

        if (!error) {
            setLockedTasks(prev => ({ ...prev, [taskId]: newLockState }));
        }
    };

    const handleDownloadMyData = async () => {
        try {
            const teamId = userProfile?.team_id;
            const data: any = {
                version: '1.0-granular',
                timestamp: new Date().toISOString(),
            };

            if (downloadSelection.perfil) data.perfil = userProfile;

            if (teamId) {
                if (downloadSelection.equipo) {
                    const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single();
                    data.equipo = team;
                }
                if (downloadSelection.tareas) {
                    const { data: tasks } = await supabase.from('tasks').select('*').eq('team_id', teamId);
                    data.tareas = tasks || [];
                }
                if (downloadSelection.platos) {
                    const { data: platos } = await supabase.from('platos').select('*').eq('team_id', teamId);
                    data.platos = platos || [];
                }
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mis_datos_proyecto_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setShowDownloadOptions(false);
        } catch (err) {
            alert("Error al descargar tus datos");
        }
    };

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Top bar */}
            <header className="border-b border-white/5 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src="https://lh3.googleusercontent.com/d/1nu2fOvKoWMIKGehqtjLjpcjuqiyMSR8A"
                            alt="Logo IES La Flota"
                            className="h-10 w-auto object-contain"
                        />
                        <div className="h-6 w-px bg-white/10" />
                        <img
                            src="https://lh3.googleusercontent.com/d/1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e"
                            alt="Logo managerproapp"
                            className="h-8 w-auto object-contain"
                        />
                        <div className="hidden sm:block ml-2">
                            <h1 className="text-white font-bold text-sm">Carta Sostenible · Región de Murcia</h1>
                            <p className="text-emerald-500/60 text-[10px] uppercase tracking-wider font-bold">IES La Flota de Murcia · 26/27</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowDownloadOptions(true)}
                            className="p-2 text-gray-500 hover:text-emerald-400 transition-colors"
                            title="Descargar mis datos y proyecto"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>

                        {zone && (
                            <button
                                onClick={onChangeZone}
                                className="flex items-center gap-2 text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <span>{zone.emoji}</span>
                                <span>{zone.name}</span>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Zone hero */}
                {zone && (
                    <div className="bg-gradient-to-r from-emerald-950/50 to-gray-900/50 border border-emerald-500/20 rounded-3xl p-8 mb-12">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                            <div className="text-6xl">{zone.emoji}</div>
                            <div className="flex-1">
                                <div className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-1">Zona Seleccionada</div>
                                <h2 className="text-white text-3xl font-black mb-1">{zone.name}</h2>
                                <p className="text-emerald-400 font-semibold text-sm mb-3">{zone.concept} · {zone.territory}</p>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">{zone.description}</p>
                            </div>
                            <div className="flex flex-col gap-3 min-w-[240px]">
                                <div>
                                    <p className="text-emerald-500/70 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Pequeña Despensa Sugerida
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {zone.ingredients.map((ing) => (
                                            <span key={ing} className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium px-2.5 py-1 rounded-md">
                                                {ing}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Project phases */}
                <div className="mb-8">
                    <h2 className="text-white text-2xl font-black mb-2">Fases del Proyecto</h2>
                    <p className="text-gray-500 text-sm">Completa cada fase para construir tu carta sostenible.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {TASKS.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => handleTaskClick(task.id)}
                            className={`relative p-6 rounded-3xl border-2 transition-all duration-500 hover:-translate-y-2 cursor-pointer group shadow-xl hover:shadow-2xl ${colorMap[task.color]} ${lockedTasks[task.id] ? 'opacity-90 grayscale-[0.2]' : ''}`}
                        >
                            <div className="flex items-start gap-5 mb-5">
                                <div className="text-4xl flex flex-col items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform">
                                    {task.icon}
                                    {lockedTasks[task.id] && (
                                        <div className="absolute -top-3 -right-3 bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-950 text-sm animate-bounce" title="Fase Bloqueada">🔒</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`inline-block text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${badgeMap[task.color]} shadow-sm`}>
                                            FASE {task.step}
                                        </div>
                                        {isImpersonated && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleLock(task.id); }}
                                                className="text-[9px] font-black uppercase tracking-widest bg-gray-950/40 hover:bg-gray-950/60 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all active:scale-90"
                                            >
                                                {lockedTasks[task.id] ? '🔓 Abrir' : '🔒 Cerrar'}
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="text-white font-black text-lg tracking-tight leading-tight group-hover:text-emerald-400 transition-colors uppercase">{task.title}</h3>
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs leading-relaxed font-medium mb-6 line-clamp-2">{task.description}</p>
                            <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${taskStatuses[task.id] === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${taskStatuses[task.id] === 'completed' ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {taskStatuses[task.id] === 'completed' ? 'Completado' : (taskStatuses[task.id]?.replace('_', ' ') || 'Pendiente')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-emerald-500 opacity-0 group-hover:opacity-100 transition-all uppercase font-black tracking-widest translate-x-2 group-hover:translate-x-0">Abrir Fase</span>
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-gray-950 transition-all">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-xl">
                            {userProfile?.teams?.name?.[0] || 'B'}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl font-black text-white tracking-tight uppercase">
                                    {userProfile?.teams?.name || 'Mi Brigada'}
                                </h1>
                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                                    Activa
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium text-sm">
                                {zone?.name || 'Zona no seleccionada'} · {userProfile?.teams?.invite_code || '---'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowDownloadOptions(true)}
                            className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group active:scale-95 shadow-lg"
                        >
                            <span className="text-xl group-hover:scale-125 transition-transform">📥</span>
                            <div className="text-left">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Descargar Mis Datos</div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase">Backup Personal</div>
                            </div>
                        </button>
                        <button
                            onClick={onChangeZone}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95 shadow-lg text-gray-500 hover:text-white"
                            title="Cambiar Zona"
                        >
                            ⚙️
                        </button>
                    </div>
                </div>

                {/* Project Resources & Actions */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm flex flex-col justify-between">
                        <div>
                            <div className="text-3xl mb-4">📥</div>
                            <h3 className="text-xl font-black text-white mb-2">Descargar Mi Carpeta Digital</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Obtén una copia personalizada de tu perfil, equipo, tareas y platos registrados.
                                Puedes elegir qué partes descargar.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDownloadOptions(true)}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Opciones de Descarga
                        </button>
                    </div>

                    {/* Download Modal */}
                    {showDownloadOptions && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-gray-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full shadow-2xl">
                                <h3 className="text-2xl font-black mb-2">Descarga Granular</h3>
                                <p className="text-gray-500 text-xs mb-8 uppercase tracking-widest font-bold">Selecciona qué incluir</p>

                                <div className="space-y-4 mb-10">
                                    {Object.entries(downloadSelection).map(([key, value]) => (
                                        <label key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group">
                                            <span className="text-sm font-bold capitalize text-gray-400 group-hover:text-white">{key}</span>
                                            <input
                                                type="checkbox"
                                                checked={value as boolean}
                                                onChange={() => setDownloadSelection(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                                className="w-5 h-5 rounded-lg bg-gray-800 border-white/10 text-emerald-500 focus:ring-emerald-500"
                                            />
                                        </label>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleDownloadMyData}
                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                                    >
                                        Iniciar Descarga JSON
                                    </button>
                                    <button
                                        onClick={() => setShowDownloadOptions(false)}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gradient-to-br from-blue-600/10 to-emerald-600/10 border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 text-5xl opacity-10 group-hover:scale-110 transition-transform duration-500">🛡️</div>
                        <h3 className="text-xl font-black text-white mb-4">Compromiso Sostenible</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Recuerda que todos los ingredientes seleccionados deben cumplir con los criterios de proximidad (Km 0) y temporada de la Región de Murcia.
                        </p>
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                            Validado por Sistema
                        </div>
                    </div>
                </div>

                {/* Coming soon footer */}
                <div className="mt-12 text-center py-12 border-t border-white/5">
                    <p className="text-gray-600 text-[10px] uppercase font-black tracking-[0.2em]">Brigada Digital · IES La Flota · 2026/27</p>
                </div>
            </main>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-950/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-gray-900 border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-${selectedTask.color}-500`} />

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{selectedTask.icon}</span>
                                <div>
                                    <h3 className="text-2xl font-black text-white">{selectedTask.title}</h3>
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Fase {selectedTask.step} · IES La Flota</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-white transition-colors text-xl">✕</button>
                        </div>

                        <p className="text-gray-400 text-sm mb-6 leading-relaxed italic border-l-2 border-white/5 pl-4">
                            {selectedTask.description}
                        </p>

                        <div className="space-y-4 mb-8">
                            {selectedTask.id === 1 ? (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <h4 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">Documento de Entrega</h4>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Nombre de la Brigada</p>
                                            <p className="text-white font-bold">{userProfile?.teams?.name || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Zona Gastronómica</p>
                                            <p className="text-white font-bold">{zone?.name || '---'}</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <p className="text-gray-500 text-[10px] uppercase font-bold mb-2">Componentes y Roles a Desarrollar</p>
                                        <div className="space-y-2">
                                            {userProfile?.teams?.role_assignments && Object.keys(userProfile.teams.role_assignments).length > 0 ? (
                                                Object.entries(userProfile.teams.role_assignments).map(([roleId, name]) => {
                                                    if (!name) return null;
                                                    const title = {
                                                        coordinador: '👑 Coordinador/a',
                                                        visual: '🎨 Especialista Visual',
                                                        digital: '📲 Arquitecto/a Digital',
                                                        comunicacion: '📢 Resp. Comunicación',
                                                        produccion: '⚖️ Director/a Producción'
                                                    }[roleId] || roleId;
                                                    return (
                                                        <div key={roleId} className="flex items-center justify-between text-sm bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                                            <span className="text-gray-300 font-bold">{name as string}</span>
                                                            <span className="text-emerald-500/80 text-[10px] font-black uppercase tracking-widest">{title}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-gray-500 text-sm italic">Roles aún no asignados.</div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase font-bold mb-2">Breve Justificación (2-3 líneas)</p>
                                        <textarea
                                            value={taskContent}
                                            onChange={(e) => setTaskContent(e.target.value)}
                                            disabled={lockedTasks[selectedTask.id] && !isImpersonated}
                                            className="w-full h-24 bg-gray-900/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-700 outline-none transition-all resize-none shadow-inner focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                                            placeholder="Justifica aquí por qué habéis elegido esta zona..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <label className="block text-xs font-black uppercase tracking-widest text-emerald-500/70 mb-2">Desarrollo de la Fase:</label>
                                    <textarea
                                        value={taskContent}
                                        onChange={(e) => setTaskContent(e.target.value)}
                                        disabled={lockedTasks[selectedTask.id] && !isImpersonated}
                                        className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white placeholder-gray-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all resize-none shadow-inner"
                                        placeholder="Describe aquí el trabajo realizado por la brigada para esta fase..."
                                    />
                                </>
                            )}
                            {lockedTasks[selectedTask.id] && !isImpersonated && (
                                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] p-3 rounded-xl font-bold text-center mt-4">
                                    🔒 Esta fase ha sido validada y está bloqueada para edición.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                            >
                                Cerrar
                            </button>
                            {(!lockedTasks[selectedTask.id] || isImpersonated) && (
                                <button
                                    onClick={handleSaveTask}
                                    disabled={saving}
                                    className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Progreso'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
