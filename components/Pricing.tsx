
import React from 'react';
import { PRICING_PLANS, PricingPlan } from '../constants';
import { CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

const Pricing: React.FC = () => {
  const { language, t } = useLanguage();
  const plans: PricingPlan[] = PRICING_PLANS[language];
  const calendlyLink = "https://calendly.com/lucchettan/30min";

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">{t.pricingTitle}</h2>
          {t.pricingSubtitle && <p className="text-lg text-brand-gray mt-4 max-w-2xl mx-auto">{t.pricingSubtitle}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch justify-center">
          {plans.map((plan) => {
            const isFeatured = !!plan.isFeatured;
            
            return (
              <div key={plan.id} className={`relative bg-brand-light rounded-xl p-8 border ${isFeatured ? 'border-yellow-400' : 'border-gray-200'} transition-all duration-300 flex flex-col hover:shadow-xl hover:border-brand-blue`}>
                <h3 className="text-2xl font-semibold text-brand-dark mt-4">{plan.name}</h3>
                <p className="text-brand-gray mt-2 mb-6 min-h-[3rem]">{plan.description}</p>
                
                <div className="mb-8">
                  <span className="text-5xl font-medium text-brand-gray line-through">€{plan.originalPrice}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold text-brand-dark">€{plan.price}</span>
                      <span className="text-lg text-brand-gray">
                        {plan.period}
                      </span>
                  </div>
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
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-12">
            <p className="text-lg text-brand-dark font-semibold mb-4">{t.pricingDemoSubtitle}</p>
            <a 
                href={calendlyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-brand-blue text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
            >
                {t.letsTalk}
            </a>
        </div>
      </div>
    </section>
  );
};

export default Pricing;