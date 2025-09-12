import React, { useState } from 'react';
import { PRICING_PLANS } from '../constants';
import { CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

type BillingCycle = 'monthly' | 'yearly';

const Pricing: React.FC = () => {
  const { language, t } = useLanguage();
  const plans = PRICING_PLANS[language];
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const handleToggle = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
  };

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">{t.pricingTitle}</h2>
          <p className="text-lg text-brand-gray mt-4 max-w-2xl mx-auto">{t.pricingSubtitle}</p>
        </div>
        
        <div className="flex justify-center items-center mb-10">
          <div className="relative flex items-center p-1 bg-gray-200 rounded-full">
            <button 
              onClick={() => handleToggle('monthly')} 
              className={`relative z-10 w-28 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${billingCycle === 'monthly' ? 'text-white' : 'text-brand-gray'}`}
            >
              {t.monthly}
            </button>
            <button 
              onClick={() => handleToggle('yearly')} 
              className={`relative z-10 w-28 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${billingCycle === 'yearly' ? 'text-white' : 'text-brand-gray'}`}
            >
              {t.yearly}
            </button>
            <div 
              className={`absolute top-1 left-1 bg-brand-blue w-28 h-9 rounded-full transition-transform duration-300 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-full' : ''}`}
            />
             <span className="absolute -top-3 -right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full transform rotate-12">{t.save25}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-brand-light rounded-xl p-8 border ${plan.name === 'Lifetime' || plan.name === 'À Vie' || plan.name === 'De por vida' ? 'border-yellow-400' : 'border-gray-200'} transition-all duration-300 flex flex-col hover:shadow-xl hover:border-brand-blue`}>
              <h3 className="text-2xl font-semibold text-brand-dark">{plan.name}</h3>
              <p className="text-brand-gray mt-2 mb-6 min-h-[3rem]">{plan.description}</p>
              
              <div className="mb-8">
                {'onetime' in plan.pricing ? (
                  <>
                    <span className="text-5xl font-extrabold text-brand-dark">€{plan.pricing.onetime}</span>
                    <span className="text-lg text-brand-gray"> / {t.lifetime}</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl font-extrabold text-brand-dark">€{plan.pricing[billingCycle]}</span>
                    <span className="text-lg text-brand-gray">/ {billingCycle === 'monthly' ? t.month : t.year}</span>
                  </>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-brand-blue mr-3 flex-shrink-0" />
                    <span className="text-brand-gray">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full mt-auto py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${plan.name === 'Lifetime' || plan.name === 'À Vie' || plan.name === 'De por vida' ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' : 'bg-brand-blue text-white hover:bg-blue-600'}`}>
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