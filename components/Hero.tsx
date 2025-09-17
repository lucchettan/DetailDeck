
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent } from '../lib/analytics';

interface HeroProps {
  onWaitingListClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onWaitingListClick }) => {
  const { t } = useLanguage();

  const handleWaitingListClick = () => {
    trackEvent('cta_click_waitinglist');
    onWaitingListClick();
  };

  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-b from-white to-brand-light">
      <div className="relative container mx-auto px-6 text-center z-10">
        <p className="font-semibold text-brand-dark bg-yellow-200/50 text-yellow-900 px-4 py-2 rounded-full border border-yellow-300/80 inline-block mb-6">
            {t.launchingSoon}
        </p>
        <h1 className="text-4xl md:text-6xl font-black text-brand-dark leading-tight mb-4">
          {t.heroTitle1} <span className="text-brand-blue">{t.heroTitle2}</span>
        </h1>
        <p className="text-lg md:text-xl text-brand-gray max-w-3xl mx-auto mb-8">
          {t.heroSubtitle1} <span className="font-bold text-brand-dark">{t.heroSubtitle2}</span>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleWaitingListClick}
              className="bg-white text-brand-blue font-bold py-4 px-8 rounded-lg text-lg border-2 border-brand-blue hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-sm"
            >
              {t.joinWaitingList}
            </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
