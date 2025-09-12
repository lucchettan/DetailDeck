import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const HowItWorks: React.FC = () => {
  const { language, t } = useLanguage();
  const steps = HOW_IT_WORKS_STEPS[language];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">{t.howItWorksTitle}</h2>
          <p className="text-lg text-brand-blue font-semibold mt-4 max-w-2xl mx-auto">{t.howItWorksSubtitle}</p>
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gray-200"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white border-2 border-brand-blue rounded-full text-brand-blue text-2xl font-bold z-10 relative">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-brand-dark mb-2">{step.title}</h3>
                <p className="text-brand-gray">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;