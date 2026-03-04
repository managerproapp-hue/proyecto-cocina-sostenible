import { useState } from 'react';
import { ZONAS_MURCIA } from '../data/zonas';
import type { Zone } from '../types';

interface ZoneSelectorViewProps {
    onSelect: (zone: Zone) => void;
    onBack: () => void;
}

export default function ZoneSelectorView({ onSelect, onBack }: ZoneSelectorViewProps) {
    const [selected, setSelected] = useState<Zone | null>(null);

    return (
        <div className="min-h-screen bg-gray-950 px-6 py-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver
                    </button>

                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6">
                        <span className="text-amber-400 text-sm font-medium">Paso 1 de 3</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Elige tu Zona Geográfica
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl">
                        Selecciona la zona de la Región de Murcia que inspirará tu carta sostenible.
                        Cada zona tiene productos autóctonos y una identidad culinaria propia.
                    </p>
                </div>

                {/* Zones Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                    {ZONAS_MURCIA.map((zone) => {
                        const isSelected = selected?.id === zone.id;

                        return (
                            <button
                                key={zone.id}
                                onClick={() => setSelected(zone)}
                                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 group
                  ${isSelected
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                                    }
                `}
                            >
                                {/* Selected check */}
                                {isSelected && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}

                                <div className="text-4xl mb-4">{zone.emoji}</div>
                                <h3 className={`font-bold text-lg mb-1 transition-colors ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                    {zone.name}
                                </h3>
                                <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-3">
                                    {zone.concept}
                                </p>
                                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                    {zone.description}
                                </p>

                                {/* Ingredient tags */}
                                <div className="flex flex-wrap gap-1.5">
                                    {zone.ingredients.slice(0, 4).map((ing: string) => (
                                        <span
                                            key={ing}
                                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors
                        ${isSelected
                                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                                    : 'border-white/10 bg-white/5 text-gray-500'
                                                }
                      `}
                                        >
                                            {ing}
                                        </span>
                                    ))}
                                    {zone.ingredients.length > 4 && (
                                        <span className="text-xs px-2 py-0.5 text-gray-600">
                                            +{zone.ingredients.length - 4} más
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Confirm button */}
                {selected && (
                    <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => onSelect(selected)}
                            className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/25 hover:-translate-y-0.5"
                        >
                            <span>Confirmar Zona: {selected.name}</span>
                            <span className="text-xl">{selected.emoji}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
