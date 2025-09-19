
import React, { useState } from 'react';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import HowItWorks from './HowItWorks';
import Pricing from './Pricing';
import FAQ from './FAQ';
import Footer from './Footer';
import WaitingListModal from './WaitingListModal';
import OnboardingModal from './OnboardingModal';
import PaymentSuccess from './PaymentSuccess';
import { useAuth } from '../contexts/AuthContext';
import Benefits from './Benefits';

const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  
  return (
    <div className="bg-white text-brand-gray font-sans antialiased">
      <Header onDemoClick={demoLogin} />
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

export default LandingPage;
