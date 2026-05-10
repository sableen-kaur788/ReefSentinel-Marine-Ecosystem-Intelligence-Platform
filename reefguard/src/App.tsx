import { useState } from 'react';
import { OceanBackground } from './components/effects/OceanBackground';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { KnowledgeAssistant } from './pages/KnowledgeAssistant';

type AppView = 'landing' | 'dashboard' | 'assistant';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <OceanBackground />

      {/* Main Content */}
      <div className="relative z-10">
        {currentView === 'landing' && (
          <LandingPage onLaunchDashboard={() => setCurrentView('dashboard')} />
        )}
        
        {currentView === 'dashboard' && (
          <Dashboard 
            onNavigateToAssistant={() => setCurrentView('assistant')} 
            onBack={() => setCurrentView('landing')}
          />
        )}
        
        {currentView === 'assistant' && (
          <KnowledgeAssistant 
            onBack={() => setCurrentView('dashboard')} 
          />
        )}
      </div>
    </div>
  );
}

export default App;
