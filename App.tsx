
import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Showcase from './components/Showcase';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import EarlyAccessModal from './components/EarlyAccessModal';
import WaitingListModal from './components/WaitingListModal';
import OnboardingModal from './components/OnboardingModal';
import PaymentModal from './components/PaymentModal';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';

export interface SelectedPlan {
  id: 'solo' | 'business' | 'lifetime';
  name: string;
  billingCycle: 'monthly' | 'yearly' | 'onetime';
  price: string;
}

const App: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);


  const handleSignUpSuccess = () => {
    setIsAuthModalOpen(false);
    setIsOnboardingModalOpen(true);
  };

  const handleChoosePlan = (plan: SelectedPlan) => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="bg-white text-brand-gray font-sans antialiased">
          <Header onGetStartedClick={() => setIsAuthModalOpen(true)} />
          <main>
            <Hero 
              onEarlyAccessClick={() => setIsEarlyAccessModalOpen(true)} 
              onWaitingListClick={() => setIsWaitingListModalOpen(true)}
            />
            <HowItWorks />
            <Features />
            <Showcase />
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
          />
          <WaitingListModal
            isOpen={isWaitingListModalOpen}
            onClose={() => setIsWaitingListModalOpen(false)}
          />
          <OnboardingModal
            isOpen={isOnboardingModalOpen}
            onClose={() => setIsOnboardingModalOpen(false)}
          />
          {selectedPlan && (
            <PaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              plan={selectedPlan}
            />
          )}
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
