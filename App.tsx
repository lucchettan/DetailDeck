
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

// This is a central type used across payment flows.
export type SelectedPlanId = 'solo' | 'lifetime';
export interface SelectedPlan {
  id: SelectedPlanId;
  name: string;
  billingCycle: 'monthly' | 'yearly' | 'onetime';
  price: string;
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      setShowPaymentSuccess(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSignUpSuccess = () => {
    setIsAuthModalOpen(false);
    setIsOnboardingModalOpen(true);
  };

  // Unified flow: all "choose plan" buttons now open the early access modal.
  const handleChoosePlan = () => {
    setIsEarlyAccessModalOpen(true);
  };
  
  const handleSwitchToLogin = () => {
    setIsEarlyAccessModalOpen(false);
    setIsAuthModalOpen(true);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }
  
  if (showPaymentSuccess) {
    return <PaymentSuccess onReturnToHome={() => setShowPaymentSuccess(false)} />;
  }

  return (
    <div className="bg-white text-brand-gray font-sans antialiased">
      <Header onGetStartedClick={() => setIsAuthModalOpen(true)} />
      <main>
        <Hero 
          onEarlyAccessClick={() => setIsEarlyAccessModalOpen(true)} 
          onWaitingListClick={() => setIsWaitingListModalOpen(true)}
        />
        <HowItWorks />
        <Features />
        <Pricing onChoosePlan={handleChoosePlan} />
        <FAQ />
      </main>
      <Footer />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSignUpSuccess={handleSignUpSuccess}
      />
      <EarlyAccessModal
        isOpen={isEarlyAccessModalOpen}
        onClose={() => setIsEarlyAccessModalOpen(false)}
        onLoginClick={handleSwitchToLogin}
      />
      <WaitingListModal
        isOpen={isWaitingListModalOpen}
        onClose={() => setIsWaitingListModalOpen(false)}
      />
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
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