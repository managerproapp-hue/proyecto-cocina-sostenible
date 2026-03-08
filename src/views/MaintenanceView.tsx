import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface MaintenanceViewProps {
    onBack: () => void;
}

const TABLES = [
    { id: 'profiles', name: 'Perfiles de Usuario', icon: '👤' },
    { id: 'teams', name: 'Brigadas (Equipos)', icon: '🤝' },
    { id: 'tasks', name: 'Tareas y Progreso', icon: '📋' },
    { id: 'platos', name: 'Recetario (Platos)', icon: '🍳' },
    { id: 'config', name: 'Configuración Sistema', icon: '⚙️' },
    { id: 'audit_logs', name: 'Logs de Auditoría', icon: '📜' }
];

export default function MaintenanceView({ onBack }: MaintenanceViewProps) {
    const [selectedTables, setSelectedTables] = useState<string[]>(TABLES.map(t => t.id));
    const [loading, setLoading] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [restoreData, setRestoreData] = useState<any>(null);
    const [selectedRestoreTables, setSelectedRestoreTables] = useState<string[]>([]);

    const handleToggleTable = (id: string) => {
        setSelectedTables(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleDownloadBackup = async () => {
        if (selectedTables.length === 0) return alert("Selecciona al menos una tabla");
        setLoading(true);
        try {
            const backupData: any = {
                version: '2.0',
                timestamp: new Date().toISOString(),
                tables: {}
            };

            for (const table of selectedTables) {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw error;
                backupData.tables[table] = data;
            }

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_granular_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                setRestoreData(json);
                setRestoreFile(file);
                if (json.tables) {
                    setSelectedRestoreTables(Object.keys(json.tables));
                }
            } catch (err) {
                alert("Archivo JSON inválido");
            }
        };
        reader.readAsText(file);
    };

    const handleRestore = async () => {
        if (!restoreData || selectedRestoreTables.length === 0) return;
        const confirm = window.confirm("¿Estás seguro de restaurar estas tablas? Los datos actuales en esas tablas serán sobrescritos o duplicados según la lógica de DB.");
        if (!confirm) return;

        setLoading(true);
        try {
            for (const table of selectedRestoreTables) {
                const rows = restoreData.tables[table];
                if (!rows || rows.length === 0) continue;

                // Simple upsert logic
                const { error } = await supabase.from(table).upsert(rows);
                if (error) throw error;
            }
            alert("✅ Restauración parcial completada con éxito");
            setRestoreData(null);
            setRestoreFile(null);
        } catch (err: any) {
            alert("Error restaurando: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNuclearReset = async () => {
        const confirm1 = window.confirm("⚠️ ATENCIÓN: Estás a punto de borrar TODO (excepto tu cuenta). ¿Estás seguro?");
        if (!confirm1) return;
        const confirm2 = window.prompt("Escribe 'ELIMINAR TODO' para confirmar:");
        if (confirm2 !== 'ELIMINAR TODO') return;

        setLoading(true);
        try {
            // Sequential delete to respect FKs
            const tablesToDelete = ['tasks', 'platos', 'teams', 'profiles'];
            for (const table of tablesToDelete) {
                if (table === 'profiles') {
                    await supabase.from(table).delete().neq('email', 'managerproapp@gmail.com');
                } else {
                    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
            }
            alert("🔥 Sistema reseteado.");
            onBack();
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                        >
                            ←
                        </button>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">Zona de Seguridad</h1>
                            <p className="text-rose-500 text-xs font-black uppercase tracking-[0.3em] mt-1">Mantenimiento Nivel Crítico</p>
                        </div>
                    </div>
                    <div className="hidden md:block px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <span className="text-xs font-bold text-rose-500 animate-pulse">● CANAL ENCRIPTADO SSL</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Backup Section */}
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-3xl">💾</span>
                            <h3 className="text-2xl font-black">Copia Granular (Backup)</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">Selecciona qué partes del sistema quieres exportar en formato JSON.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            {TABLES.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => handleToggleTable(table.id)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${selectedTables.includes(table.id)
                                        ? 'bg-emerald-500/10 border-emerald-500 text-white'
                                        : 'bg-white/5 border-white/5 text-gray-500'
                                        }`}
                                >
                                    <span className="text-xl">{table.icon}</span>
                                    <span className="text-xs font-bold uppercase tracking-tighter">{table.name}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleDownloadBackup}
                            disabled={loading}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/10"
                        >
                            {loading ? 'Generando...' : 'Descargar Selección'}
                        </button>
                    </div>

                    {/* Restore Section */}
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-3xl">📥</span>
                            <h3 className="text-2xl font-black">Restauración Inteligente</h3>
                        </div>

                        {!restoreData ? (
                            <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center group hover:border-emerald-500/30 transition-all cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                                <p className="text-gray-500 text-sm font-medium">Arrastra o selecciona un backup JSON</p>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6 flex items-center justify-between">
                                    <div className="text-xs font-bold text-emerald-400">Archivo: {restoreFile?.name}</div>
                                    <button onClick={() => setRestoreData(null)} className="text-xs text-rose-500 font-bold uppercase">Cancelar</button>
                                </div>
                                <p className="text-gray-400 text-xs mb-4">Selecciona qué tablas quieres importar del archivo:</p>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {Object.keys(restoreData.tables || {}).map(table => (
                                        <button
                                            key={table}
                                            onClick={() => setSelectedRestoreTables(prev =>
                                                prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
                                            )}
                                            className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedRestoreTables.includes(table)
                                                ? 'bg-blue-500 border-blue-400 text-white'
                                                : 'bg-white/5 border-white/10 text-gray-500'
                                                }`}
                                        >
                                            {table}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleRestore}
                                    disabled={loading || selectedRestoreTables.length === 0}
                                    className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
                                >
                                    {loading ? 'Restaurando...' : 'Restaurar Tablas Seleccionadas'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nuclear Section */}
                <div className="mt-12 bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 text-6xl opacity-10">☢️</div>
                    <div className="max-w-2xl">
                        <h3 className="text-2xl font-black text-rose-500 mb-4">Reseteo Nuclear del Sistema</h3>
                        <p className="text-rose-500/60 text-sm font-medium mb-8 leading-relaxed">
                            Esta acción eliminará permanentemente todas las brigadas, platos, tareas y perfiles de alumnos.
                            Solo tu cuenta de administrador principal sobrevivirá. Úsalo solo para limpiezas de fin de curso.
                        </p>
                        <button
                            onClick={handleNuclearReset}
                            disabled={loading}
                            className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl shadow-rose-500/20"
                        >
                            Ejecutar Borrado Total
                        </button>
                    </div>
                </div>

                <footer className="mt-12 text-center text-gray-700 text-[10px] uppercase font-black tracking-widest">
                    Seguridad Avanzada · Proyecto Cocina Sostenible · 2026/27
                </footer>
            </div>
        </div>
    );
}
