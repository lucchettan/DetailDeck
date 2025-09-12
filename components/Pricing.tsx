import React from 'react';
import { PRICING_PLANS } from '../constants';
import { CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

const Pricing: React.FC = () => {
  const { language, t } = useLanguage();
  const plans = PRICING_PLANS[language];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">{t.pricingTitle}</h2>
          <p className="text-lg text-brand-gray mt-4 max-w-2xl mx-auto">{t.pricingSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-brand-light rounded-xl p-8 border border-gray-200 transition-all duration-300 flex flex-col hover:shadow-xl`}>
              <h3 className="text-2xl font-semibold text-brand-dark">{plan.name}</h3>
              <p className="text-brand-gray mt-2 mb-6">{plan.description}</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-brand-dark">€{plan.price}</span>
                <span className="text-lg text-brand-gray">/ {language === 'fr' ? 'mois' : 'month'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-brand-blue mr-3 flex-shrink-0" />
                    <span className="text-brand-gray">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full mt-auto py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 bg-brand-blue text-white hover:bg-blue-600`}>
                {t.choosePlan}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;