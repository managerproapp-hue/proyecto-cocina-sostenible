import { useState } from 'react';
import LandingView from './views/LandingView';
import ZoneSelectorView from './views/ZoneSelectorView';
import DashboardView from './views/DashboardView';
import type { Zone } from './types';

type View = 'landing' | 'zone-selector' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const handleZoneSelected = (zone: Zone) => {
    setSelectedZone(zone);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingView onStart={() => setCurrentView('zone-selector')} />;
      case 'zone-selector':
        return (
          <ZoneSelectorView
            onSelect={handleZoneSelected}
            onBack={() => setCurrentView('landing')}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            zone={selectedZone}
            onChangeZone={() => setCurrentView('zone-selector')}
          />
        );
      default:
        return <LandingView onStart={() => setCurrentView('zone-selector')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {renderView()}
    </div>
  );
}

export default App;
