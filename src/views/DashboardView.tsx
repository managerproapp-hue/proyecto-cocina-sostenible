import type { Zone } from '../types';

interface DashboardViewProps {
    zone: Zone | null;
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

export default function DashboardView({ zone, onChangeZone }: DashboardViewProps) {
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
                            alt="Logo jcbprofesor"
                            className="h-8 w-auto object-contain"
                        />
                        <div className="hidden sm:block ml-2">
                            <h1 className="text-white font-bold text-sm">Carta Sostenible · Región de Murcia</h1>
                            <p className="text-emerald-500/60 text-[10px] uppercase tracking-wider font-bold">IES La Flota de Murcia · 26/27</p>
                        </div>
                    </div>

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
                            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${colorMap[task.color]}`}
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`text-3xl`}>{task.icon}</div>
                                <div className="flex-1">
                                    <div className={`inline-block text-xs font-black px-2 py-0.5 rounded-full ${badgeMap[task.color]} mb-2`}>
                                        FASE {task.step}
                                    </div>
                                    <h3 className="text-white font-bold text-lg leading-tight">{task.title}</h3>
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">{task.description}</p>
                            <div className="mt-5 flex items-center justify-between">
                                <span className="text-xs text-gray-600 border border-white/10 px-2 py-1 rounded-full">
                                    Pendiente
                                </span>
                                <svg className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coming soon */}
                <div className="mt-12 text-center p-8 border border-dashed border-white/10 rounded-2xl">
                    <div className="text-3xl mb-3">🚧</div>
                    <h3 className="text-white font-bold mb-1">Más funcionalidades próximamente</h3>
                    <p className="text-gray-600 text-sm">Brigada Digital, gestor de recetas, informe final y mucho más.</p>
                </div>
            </main>
        </div>
    );
}
