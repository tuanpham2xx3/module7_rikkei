import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppHeader, type ActiveSection } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LandingSection } from './components/sections/LandingSection';
import { CheckinSection } from './components/sections/CheckinSection';
import { TimelineSection } from './components/sections/TimelineSection';
import { RecapSection } from './components/sections/RecapSection';
import { StickersSection } from './components/sections/StickersSection';
import { QuotaModal } from './components/modals/QuotaModal';
import { AuthModal } from './components/modals/AuthModal';

export function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('landing');
  const [isQuotaOpen, setIsQuotaOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#faf9f6] text-[#18181b] select-none">
        {/* Application Navbar */}
        <AppHeader
          activeSection={activeSection}
          onNavigate={(sec) => setActiveSection(sec)}
          onOpenQuotaModal={() => setIsQuotaOpen(true)}
          onOpenAuthModal={() => setIsAuthOpen(true)}
        />

        {/* Main Workspace Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto flex flex-col justify-center relative pb-20 md:pb-6">
          {activeSection === 'landing' && (
            <LandingSection onStartWriting={() => setActiveSection('checkin')} />
          )}

          {activeSection === 'checkin' && (
            <CheckinSection onGoToTimeline={() => setActiveSection('timeline')} />
          )}

          {activeSection === 'timeline' && (
            <TimelineSection
              onGoToCheckin={() => setActiveSection('checkin')}
              onGoToRecap={() => setActiveSection('recap')}
            />
          )}

          {activeSection === 'recap' && (
            <RecapSection onBackToTimeline={() => setActiveSection('timeline')} />
          )}

          {activeSection === 'stickers' && <StickersSection />}
        </main>

        {/* Bottom Floating Navigation for Mobile */}
        <BottomNav
          activeSection={activeSection}
          onNavigate={(sec) => setActiveSection(sec)}
        />

        {/* Quota Modal */}
        <QuotaModal
          isOpen={isQuotaOpen}
          onClose={() => setIsQuotaOpen(false)}
        />

        {/* Auth Modal (Google & Email/Password) */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
