
import React, { useState } from 'react';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import HowItWorks from './HowItWorks';
import Pricing from './Pricing';
import FAQ from './FAQ';
import Footer from './Footer';
import WaitingListModal from './WaitingListModal';
import PaymentSuccess from './PaymentSuccess';
import { useAuth } from '../contexts/AuthContext';
import Benefits from './Benefits';

interface LandingPageProps {
  navigate: (path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { accessDemo } = useAuth();
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoClick = async () => {
    setIsDemoLoading(true);
    const { error } = await accessDemo();
    if (!error) {
      // Use the navigate function passed from the App component,
      // which safely handles routing in the preview environment.
      navigate('/dashboard');
    } else {
      console.error('Demo access failed:', error);
      alert(`Demo access failed: ${error.message}. Please try again.`);
    }
    setIsDemoLoading(false);
  };

  return (
    <div className="bg-white text-neutral-dark font-primary antialiased">
      <Header onDemoClick={handleDemoClick} isDemoLoading={isDemoLoading} />
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
      <PaymentSuccess onReturnToHome={() => { }} />
    </div>
  );
}

export default LandingPage;
