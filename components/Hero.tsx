import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Hero: React.FC = () => {
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
        <div className="flex justify-center flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30">
            {t.startTrial}
          </button>
          <button className="bg-white text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:bg-gray-200 transition-all duration-300 border border-gray-300">
            {t.learnMore}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;