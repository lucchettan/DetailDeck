import React, { useState } from 'react';
import { PRICING_PLANS, PricingPlan } from '../constants';
import { CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface PricingProps {
  onChoosePlan: () => void;
}

type BillingCycle = 'monthly' | 'yearly';

const Pricing: React.FC<PricingProps> = ({ onChoosePlan }) => {
  const { language, t } = useLanguage();
  const plans: PricingPlan[] = PRICING_PLANS[language];
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
             <span className="absolute -top-3 -right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full transform rotate-12">{t.annualPromo}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch justify-center">
          {plans.map((plan) => {
            const isFeatured = plan.id === 'lifetime';
            
            // Refactored logic for clarity and type safety
            const onetimeInfo = plan.pricing.onetime;
            const yearlyInfo = plan.pricing.yearly;
            const monthlyInfo = plan.pricing.monthly;

            let displayPrice: string | undefined;
            let originalPrice: string | undefined;
            let billingPeriod: string;

            if (onetimeInfo) {
              displayPrice = onetimeInfo.earlyBird;
              originalPrice = onetimeInfo.regular;
              billingPeriod = t.lifetime;
            } else if (billingCycle === 'yearly' && yearlyInfo) {
              displayPrice = yearlyInfo.earlyBird;
              originalPrice = yearlyInfo.regular;
              billingPeriod = t.year;
            } else if (billingCycle === 'monthly' && monthlyInfo) {
              displayPrice = monthlyInfo.regular;
              billingPeriod = t.month;
            } else {
              // Skip rendering this plan if no valid price is found for the current toggle state.
              return null;
            }
            
            return (
              <div key={plan.id} className={`relative bg-brand-light rounded-xl p-8 border ${isFeatured ? 'border-yellow-400' : 'border-gray-200'} transition-all duration-300 flex flex-col hover:shadow-xl hover:border-brand-blue`}>
                <div>
                  <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">{t.earlyBird}</div>
                  
                  <h3 className="text-2xl font-semibold text-brand-dark mt-4">{plan.name}</h3>
                  <p className="text-brand-gray mt-2 mb-6 min-h-[3rem]">{plan.description}</p>
                  
                  <div className="mb-8">
                    { originalPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold text-brand-dark">€{displayPrice}</span>
                        <span className="text-xl font-medium text-brand-gray line-through">€{originalPrice}</span>
                      </div>
                    ) : (
                      <span className="text-5xl font-extrabold text-brand-dark">€{displayPrice}</span>
                    )}

                    <span className="text-lg text-brand-gray">
                      / {billingPeriod}
                    </span>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, i) => {
                      return (
                        <li key={i} className="flex items-center">
                          <CheckIcon className="w-5 h-5 text-brand-blue mr-3 flex-shrink-0" />
                          <span className="text-brand-gray">{feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <button 
                    onClick={onChoosePlan}
                    className={`w-full mt-auto py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${isFeatured ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' : 'bg-brand-blue text-white hover:bg-blue-600'}`}>
                    {t.choosePlan}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;