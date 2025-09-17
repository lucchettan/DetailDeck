
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import EarlyAccessModal from './components/EarlyAccessModal';
import WaitingListModal from './components/WaitingListModal';
import OnboardingModal from './components/OnboardingModal';
import PaymentSuccess from './components/PaymentSuccess';
import Dashboard from './components/Dashboard';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { trackEvent } from './lib/analytics';
import BookingPage from './components/BookingPage';
import Benefits from './components/Benefits';

const AppContent: React.FC = () => {
  const { user, loading, demoLogin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<'login' | 'signup'>('signup');
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    // Track page view for analytics
    trackEvent('page_view');
    
    const onLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);

  }, []);
  
  const openAuthModal = (view: 'login' | 'signup' = 'signup') => {
    setAuthInitialView(view);
    setIsAuthModalOpen(true);
  };
  
  const handleSignUpSuccess = () => {
    setIsAuthModalOpen(false);
    setIsOnboardingModalOpen(true);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  const reservationMatch = path.match(/^\/reservation\/([0-9a-fA-F\-]+)/);
  if (reservationMatch) {
    const shopId = reservationMatch[1];
    // In a real app, you might want a different layout for the booking page (e.g., no main header/footer)
    return <BookingPage shopId={shopId} />;
  }

  if (user) {
    return <Dashboard />;
  }
  
  return (
    <div className="bg-white text-brand-gray font-sans antialiased">
      <Header onLogInClick={() => openAuthModal('login')} onSignUpClick={() => openAuthModal('signup')} onDemoClick={demoLogin} />
      <main>
        <Hero 
          onWaitingListClick={() => setIsWaitingListModalOpen(true)}
        />
        <Benefits />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={authInitialView}
        onSignUpSuccess={handleSignUpSuccess}
      />
      <EarlyAccessModal
        isOpen={false}
        onClose={() => {}}
        onLoginClick={() => {}}
      />
      <WaitingListModal
        isOpen={isWaitingListModalOpen}
        onClose={() => setIsWaitingListModalOpen(false)}
      />
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
      <PaymentSuccess onReturnToHome={() => {}} />
    </div>
  );
}


const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
