import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ZONAS_MURCIA } from '../data/zonas';
import type { Zone } from '../types';

interface OnboardingViewProps {
    userId: string;
    userEmail: string;
    onComplete: () => void;
}

export default function OnboardingView({ userId, userEmail, onComplete }: OnboardingViewProps) {
    const [step, setStep] = useState<'choice' | 'create' | 'join' | 'confirm'>('choice');
    const [restaurantName, setRestaurantName] = useState('');
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [inviteCode, setInviteCode] = useState('');
    const [foundTeam, setFoundTeam] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateTeam = async () => {
        if (!restaurantName || !selectedZone) return;
        setLoading(true);
        setError(null);

        try {
            // Generate a simple code: ZONE-RANDOM
            const cleanZoneName = selectedZone.name.split(' ')[0].toUpperCase();
            const randomId = Math.random().toString(36).substring(2, 5).toUpperCase();
            const code = `${cleanZoneName}-${randomId}`;

            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({
                    name: restaurantName,
                    zone_id: selectedZone.id,
                    invite_code: code,
                    status: 'activo'
                })
                .select()
                .single();

            if (teamError) throw teamError;

            // Update user profile with team_id
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ team_id: team.id })
                .eq('id', userId);

            if (profileError) throw profileError;

            onComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLookupTeam = async () => {
        if (!inviteCode) return;
        setLoading(true);
        setError(null);

        try {
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('invite_code', inviteCode.trim().toUpperCase())
                .single();

            if (teamError || !team) throw new Error('Código no válido o equipo no encontrado');

            setFoundTeam(team);
            setStep('confirm');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!foundTeam) return;
        setLoading(true);

        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ team_id: foundTeam.id })
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950 text-white">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05)_0%,_transparent_50%)]" />

            <div className="relative z-10 w-full max-w-2xl bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl">

                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black mb-2">Bienvenido/a</h2>
                    <p className="text-gray-400 text-sm italic">{userEmail}</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                        ⚠️ {error}
                    </div>
                )}

                {step === 'choice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => setStep('create')}
                            className="group p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left hover:bg-emerald-500/20 transition-all hover:-translate-y-1"
                        >
                            <div className="text-4xl mb-4">🏗️</div>
                            <h3 className="text-xl font-bold mb-2">Crear Proyecto</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Si eres el primero de tu grupo, crea el restaurante y genera el código.
                            </p>
                        </button>

                        <button
                            onClick={() => setStep('join')}
                            className="group p-8 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-all hover:-translate-y-1"
                        >
                            <div className="text-4xl mb-4">🤝</div>
                            <h3 className="text-xl font-bold mb-2">Unirme a Proyecto</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Pega el código que te haya pasado un compañero de tu equipo.
                            </p>
                        </button>
                    </div>
                )}

                {step === 'create' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Nombre del Restaurante</label>
                            <input
                                type="text"
                                value={restaurantName}
                                onChange={(e) => setRestaurantName(e.target.value)}
                                placeholder="Ej. El Huerto de la Flota"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Selecciona tu Zona (Comarca)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {ZONAS_MURCIA.map((z) => (
                                    <button
                                        key={z.id}
                                        onClick={() => setSelectedZone(z)}
                                        className={`p-3 rounded-xl border transition-all text-xs font-medium ${selectedZone?.id === z.id
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        {z.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedZone && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                                <p className="text-emerald-400 text-[10px] font-bold uppercase mb-1">Despensa Sugerida:</p>
                                <p className="text-gray-300 text-xs italic">{selectedZone.ingredients.join(' · ')}</p>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setStep('choice')}
                                className="flex-1 px-6 py-4 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 font-bold transition-all"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleCreateTeam}
                                disabled={loading || !restaurantName || !selectedZone}
                                className="flex-[2] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? 'Creando...' : 'Crear y Continuar'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'join' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Código de Invitación</label>
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                placeholder="Ex. MURCIA-XYZ"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-5 text-center text-2xl font-black tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
                                autoFocus
                            />
                            <p className="mt-2 text-center text-gray-500 text-xs">Pide el código al compañero que creó el grupo.</p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setStep('choice')}
                                className="flex-1 px-6 py-4 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 font-bold transition-all"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleLookupTeam}
                                disabled={loading || !inviteCode}
                                className="flex-[2] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? 'Buscando...' : 'Validar Código'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && foundTeam && (
                    <div className="space-y-8 animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                                ✅
                            </div>
                            <h3 className="text-2xl font-black">¡Código Válido!</h3>
                            <p className="text-gray-400 mt-2">Te estás uniendo a:</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                            <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-1">Restaurante</p>
                            <p className="text-2xl font-black text-white mb-4">{foundTeam.name}</p>
                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs text-gray-400 font-bold uppercase">
                                📍 {ZONAS_MURCIA.find(z => z.id === foundTeam.zone_id)?.name || 'Zona Murcia'}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setStep('join')}
                                className="flex-1 px-6 py-4 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 font-bold transition-all"
                            >
                                Corregir
                            </button>
                            <button
                                onClick={handleJoinTeam}
                                disabled={loading}
                                className="flex-[2] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? 'Entrando...' : 'Confirmar y Unirme'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
