import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import GetStartedModal from './components/GetStartedModal';
import EarlyAccessModal from './components/EarlyAccessModal';
import WaitingListModal from './components/WaitingListModal';
import { LanguageProvider } from './contexts/LanguageContext';

const App: React.FC = () => {
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);

  return (
    <LanguageProvider>
      <div className="bg-white text-brand-gray font-sans antialiased">
        <Header onGetStartedClick={() => setIsGetStartedModalOpen(true)} />
        <main>
          <Hero 
            onEarlyAccessClick={() => setIsEarlyAccessModalOpen(true)} 
            onWaitingListClick={() => setIsWaitingListModalOpen(true)}
          />
          <HowItWorks />
          <Features />
          <Pricing />
          <FAQ />
        </main>
        <Footer />
        <GetStartedModal 
          isOpen={isGetStartedModalOpen} 
          onClose={() => setIsGetStartedModalOpen(false)} 
        />
        <EarlyAccessModal
          isOpen={isEarlyAccessModalOpen}
          onClose={() => setIsEarlyAccessModalOpen(false)}
        />
        <WaitingListModal
          isOpen={isWaitingListModalOpen}
          onClose={() => setIsWaitingListModalOpen(false)}
        />
      </div>
    </LanguageProvider>
  );
};

export default App;