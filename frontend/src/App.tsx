import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { BrowserTitlebar } from './components/layout/BrowserTitlebar';
import { AppHeader, type ActiveSection } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LandingSection } from './components/sections/LandingSection';
import { CheckinSection } from './components/sections/CheckinSection';
import { TimelineSection } from './components/sections/TimelineSection';
import { RecapSection } from './components/sections/RecapSection';
import { StickersSection } from './components/sections/StickersSection';
import { QuotaModal } from './components/modals/QuotaModal';
import { AuthModal } from './components/modals/AuthModal';

function MainApp() {
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState<ActiveSection>('checkin');
  const [isQuotaOpen, setIsQuotaOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const activeSection: ActiveSection = !user ? 'landing' : selectedSection;

  const handleStartWriting = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setSelectedSection('checkin');
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    setSelectedSection('checkin');
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-zinc-900 select-none text-zinc-900">
      <BrowserTitlebar activeSection={activeSection} />

      <AppHeader
        activeSection={activeSection}
        onNavigate={(sec) => setSelectedSection(sec)}
        onOpenQuotaModal={() => setIsQuotaOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 bg-[#faf9f6] p-3 sm:p-4 lg:p-6 overflow-y-auto md:overflow-hidden flex flex-col justify-center relative pb-24 md:pb-6 w-full max-w-full overflow-x-hidden">
        {activeSection === 'landing' && (
          <LandingSection onStartWriting={handleStartWriting} />
        )}

        {activeSection === 'checkin' && (
          <CheckinSection onGoToTimeline={() => setSelectedSection('timeline')} />
        )}

        {activeSection === 'timeline' && (
          <TimelineSection
            onGoToCheckin={() => setSelectedSection('checkin')}
            onGoToRecap={() => setSelectedSection('recap')}
          />
        )}

        {activeSection === 'recap' && (
          <RecapSection onBackToTimeline={() => setSelectedSection('timeline')} />
        )}

        {activeSection === 'stickers' && <StickersSection />}
      </main>

      {user && activeSection !== 'landing' && (
        <BottomNav
          activeSection={activeSection}
          onNavigate={(sec) => setSelectedSection(sec)}
        />
      )}

      <QuotaModal
        isOpen={isQuotaOpen}
        onClose={() => setIsQuotaOpen(false)}
        onGoToRecap={() => setSelectedSection('recap')}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={handleAuthSuccess}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
