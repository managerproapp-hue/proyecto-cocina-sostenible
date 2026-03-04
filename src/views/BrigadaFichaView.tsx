import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface BrigadaFichaViewProps {
    userId: string;
    onComplete: () => void;
}

const BRIGADA_ROLES = [
    {
        id: 'coordinador',
        title: 'COORDINADOR/A',
        subtitle: 'Gestor/a de Memoria',
        tasks: [
            'Revisar que los 20 platos estén subidos en fecha.',
            'Redactar la Introducción y Justificación del proyecto.',
            'Ensamblar el documento final (PDF) con todos los apartados grupales.'
        ],
        icon: '👑'
    },
    {
        id: 'visual',
        title: 'ESPECIALISTA VISUAL',
        subtitle: 'Líder de Carta Física',
        tasks: [
            'Diseñar la identidad visual (logotipo y colores) según la zona elegida.',
            'Crear la maqueta de la Carta Física.',
            'Asegurar que los precios coincidan con los escandallos.'
        ],
        icon: '🎨'
    },
    {
        id: 'digital',
        title: 'ARQUITECTO/A DIGITAL',
        subtitle: 'Líder de Carta QR',
        tasks: [
            'Configurar la visualización de la Carta Web.',
            'Generar el código QR de acceso.',
            'Verificar alérgenos en todos los platos.'
        ],
        icon: '📲'
    },
    {
        id: 'comunicacion',
        title: 'RESPONSABLE DE COMUNICACIÓN',
        subtitle: 'Líder de Presentación',
        tasks: [
            'Diseñar el soporte visual para la exposición (Canva/Genially).',
            'Sintetizar los puntos fuertes de los 20 platos.',
            'Vender el concepto gastronómico.'
        ],
        icon: '📢'
    },
    {
        id: 'produccion',
        title: 'DIRECTOR/A DE PRODUCCIÓN',
        subtitle: 'Líder de Viabilidad',
        tasks: [
            'Supervisar la coherencia técnica de los 20 platos.',
            'Validar que los 20 escandallos tengan sentido económico.',
            'Avisar a los compañeros si sus costes son inviables.'
        ],
        icon: '⚖️'
    }
];

export default function BrigadaFichaView({ userId, onComplete }: BrigadaFichaViewProps) {
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [signed, setSigned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!selectedRoleId || !signed) return;
        setLoading(true);
        setError(null);

        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    brigada_role: selectedRoleId,
                    has_signed_commitment: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (profileError) throw profileError;
            onComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                        FICHA DE ESTACIÓN
                    </h2>
                    <p className="text-gray-400">Selecciona tu rol en la brigada y firma el compromiso individual.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-8 text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {BRIGADA_ROLES.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`relative p-6 rounded-2xl border-2 transition-all flex flex-col text-left group ${selectedRoleId === role.id
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-white/5 bg-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className="text-3xl mb-4">{role.icon}</div>
                            <h4 className="font-black text-lg leading-tight mb-1">{role.title}</h4>
                            <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-4">{role.subtitle}</p>

                            <ul className="space-y-2 flex-1">
                                {role.tasks.map((task, i) => (
                                    <li key={i} className="text-[11px] text-gray-500 flex gap-2">
                                        <span className="text-emerald-500">•</span> {task}
                                    </li>
                                ))}
                            </ul>

                            {selectedRoleId === role.id && (
                                <div className="absolute top-4 right-4 text-emerald-500">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Commitment Section */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-12">
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-base">📜</span>
                        Compromiso Individual
                    </h3>

                    <div className="space-y-4 text-gray-400 mb-8 leading-relaxed">
                        <p className="flex gap-3">
                            <span className="text-emerald-500 font-bold">✅</span>
                            <span><strong>Diseño Propio:</strong> Me comprometo a diseñar <span className="text-white">4 platos originales</span> para la carta colectiva.</span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-emerald-500 font-bold">✅</span>
                            <span><strong>Escandallo Individual:</strong> Asumo la responsabilidad total de realizar el <span className="text-white">escandallo económico</span> de mis platos.</span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-emerald-500 font-bold">✅</span>
                            <span><strong>Calidad Técnica:</strong> Aseguraré que mis recetas mantengan los estándares de sostenibilidad y profesionalidad del centro.</span>
                        </p>
                    </div>

                    <label className="flex items-center gap-4 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={signed}
                            onChange={(e) => setSigned(e.target.checked)}
                            className="w-6 h-6 rounded-lg bg-white/10 border-white/20 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                            Acepto las cláusulas y asumo mi responsabilidad individual en el proyecto (Firma Digital).
                        </span>
                    </label>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !selectedRoleId || !signed}
                    className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-emerald-500/20"
                >
                    {loading ? 'Guardando...' : 'Finalizar Registro y Entrar'}
                </button>
            </div>
        </div>
    );
}
