import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  onEarlyAccessClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onEarlyAccessClick }) => {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-b from-white to-brand-light">
      <div className="relative container mx-auto px-6 text-center z-10">
        <h1 className="text-4xl md:text-6xl font-black text-brand-dark leading-tight mb-4">
          {t.heroTitle1} <span className="text-brand-blue">{t.heroTitle2}</span>
        </h1>
        <p className="text-lg md:text-xl text-brand-gray max-w-3xl mx-auto mb-8">
          {t.heroSubtitle}
        </p>
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="font-semibold text-brand-dark bg-yellow-200/50 text-yellow-900 px-4 py-2 rounded-full border border-yellow-300/80">
            {t.launchingSoon}
          </p>
          <button 
            onClick={onEarlyAccessClick}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-4 px-8 rounded-lg text-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/30"
          >
            {t.getEarlyAccess}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;