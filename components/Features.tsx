import React from 'react';
import { FEATURES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const Features: React.FC = () => {
  const { language, t } = useLanguage();
  const features = FEATURES[language];

  return (
    <section id="features" className="py-20 bg-brand-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">{t.featuresTitle}</h2>
          <p className="text-lg text-brand-gray mt-4 max-w-2xl mx-auto">{t.featuresSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-blue hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-brand-dark mb-2">{feature.title}</h3>
              <p className="text-brand-gray">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;