

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
  
  const handleDemoClick = async () => {
    const { error } = await demoLogin();
    if (!error) {
      window.location.href = '/dashboard';
    } else {
      console.error('Demo login failed:', error);
      alert('Demo login failed. Please check the console for details and ensure the demo account is correctly seeded in your database.');
    }
  };
  
  return (
    <div className="bg-white text-brand-gray font-sans antialiased">
      <Header onDemoClick={handleDemoClick} />
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