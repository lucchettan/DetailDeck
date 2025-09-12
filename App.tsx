import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Showcase from './components/Showcase';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import GetStartedModal from './components/GetStartedModal';
import EarlyAccessModal from './components/EarlyAccessModal';
import { LanguageProvider } from './contexts/LanguageContext';

const App: React.FC = () => {
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);

  return (
    <LanguageProvider>
      <div className="bg-white text-brand-gray font-sans antialiased">
        <Header onGetStartedClick={() => setIsGetStartedModalOpen(true)} />
        <main>
          <Hero onEarlyAccessClick={() => setIsEarlyAccessModalOpen(true)} />
          <HowItWorks />
          <Features />
          <Showcase />
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
      </div>
    </LanguageProvider>
  );
};

export default App;