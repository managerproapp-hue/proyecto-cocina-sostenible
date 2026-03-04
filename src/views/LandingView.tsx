interface LandingViewProps {
    onStart: () => void;
}

export default function LandingView({ onStart }: LandingViewProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-emerald-950/30 to-gray-950" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

            <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

            {/* School Logo */}
            <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
                <img
                    src="https://drive.google.com/uc?id=1nu2fOvKoWMIKGehqtjLjpcjuqiyMSR8A"
                    alt="Logo IES La Flota"
                    className="h-16 w-auto object-contain brightness-110 contrast-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                />
                <img
                    src="https://drive.google.com/uc?id=1DkCOqFGdw3PZbyNUnTQNgeaAGjBfv1_e"
                    alt="Logo jcbprofesor"
                    className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                />
            </div>

            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
                    <span className="text-emerald-400 text-sm">🌿</span>
                    <span className="text-emerald-400 text-sm font-medium">Proyecto Intermodular 2026/27</span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
                    Carta Sostenible
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                        Región de Murcia
                    </span>
                </h1>

                <p className="text-gray-400 text-xl md:text-2xl mb-4 font-light leading-relaxed">
                    Crea una propuesta gastronómica sostenible basada en los
                    <strong className="text-white font-semibold"> productos de km0 </strong>
                    de tu zona de Murcia.
                </p>

                <p className="text-gray-600 text-base mb-12">
                    IES La Flota de Murcia · 2026/27
                </p>

                {/* CTA Button */}
                <button
                    onClick={onStart}
                    className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all duration-300 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-1"
                >
                    <span>Comenzar Proyecto</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>

                {/* Features row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
                    {[
                        { icon: '🗺️', title: 'Elige tu Zona', desc: '7 zonas geográficas de la Región de Murcia con sus productos autóctonos' },
                        { icon: '🍽️', title: 'Diseña tu Carta', desc: 'Crea platos sostenibles usando ingredientes de proximidad y de temporada' },
                        { icon: '🌍', title: 'Impacto Real', desc: 'Documenta el impacto ambiental y social de tu propuesta culinaria' },
                    ].map((f, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm hover:bg-white/8 transition-colors">
                            <div className="text-4xl mb-3">{f.icon}</div>
                            <h3 className="text-white font-bold mb-2">{f.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
