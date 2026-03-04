import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import AlumnosView from './views/AlumnosView';
import DefinirGruposView from './views/DefinirGruposView';
import GestionAcademicaView from './views/GestionAcademicaView';
import GestionAppView from './views/GestionAppView';
import ExamenesPracticosView from './views/ExamenesPracticosView';
import GestionNotasView from './views/GestionNotasView';

// Assuming these views might exist or we fallback
// import ExamSchedulerView from './views/ExamSchedulerView';
// import EvaluationFormView from './views/EvaluationFormView';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard');

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView onNavigate={setActiveView} />;
            case 'alumnos':
                return <AlumnosView />;
            case 'definir-grupos':
                return <DefinirGruposView />;
            case 'gestion-academica':
                return <GestionAcademicaView />;
            case 'gestion-app':
                return <GestionAppView />;
            case 'examenes-practicos':
                return <ExamenesPracticosView />;
            case 'calificaciones':
                return <GestionNotasView />;
            default:
                // By default or for not-yet-imported views, just show Dashboard
                return <DashboardView onNavigate={setActiveView} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header activeView={activeView} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
