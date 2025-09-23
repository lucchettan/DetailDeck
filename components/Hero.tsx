
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
    <section className="hero-section section">
      <div className="container">
        <p className="font-semibold text-neutral-dark bg-yellow-200/50 text-yellow-900 px-4 py-2 rounded-full border border-yellow-300/80 inline-block mb-lg">
          {t.launchingSoon}
        </p>
        <h1 className="heading mb-lg">
          {t.heroTitle1} <span className="text-primary">{t.heroTitle2}</span>
        </h1>
        <p className="body-text max-w-3xl mx-auto mb-xl">
          {t.heroSubtitle1} <span className="font-bold text-neutral-dark">{t.heroSubtitle2}</span>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleWaitingListClick}
            className="btn btn-primary text-lg py-4 px-8"
          >
            {t.joinWaitingList}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
