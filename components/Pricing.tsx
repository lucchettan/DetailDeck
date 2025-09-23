
import React from 'react';
import { PRICING_PLANS, PricingPlan } from '../constants';
import { CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

const Pricing: React.FC = () => {
  const { language, t } = useLanguage();
  const plans: PricingPlan[] = PRICING_PLANS[language];
  const calendlyLink = "https://calendly.com/lucchettan/30min";

  return (
    <section id="pricing" className="section bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="sub-heading mb-md">{t.pricingTitle}</h2>
          {t.pricingSubtitle && <p className="body-text max-w-2xl mx-auto">{t.pricingSubtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch justify-center">
          {plans.map((plan) => {
            const isFeatured = !!plan.isFeatured;

            return (
              <div key={plan.id} className={`card flex flex-col ${isFeatured ? 'border-2 border-primary bg-primary-light' : ''}`}>
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Populaire
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-semibold text-neutral-dark mt-4">{plan.name}</h3>
                <p className="text-gray-600 mt-2 mb-6 min-h-[3rem]">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-3xl font-medium text-gray-400 line-through">€{plan.originalPrice}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-neutral-dark">€{plan.price}</span>
                    <span className="text-lg text-gray-600">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => {
                    return (
                      <li key={i} className="flex items-center">
                        <CheckIcon className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="cta-banner">
          <p className="text-lg text-neutral-dark font-semibold mb-4">{t.pricingDemoSubtitle}</p>
          <a
            href={calendlyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-lg py-4 px-8"
          >
            {t.letsTalk}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
