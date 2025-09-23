import React from 'react';
import { FEATURES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const Features: React.FC = () => {
  const { language, t } = useLanguage();
  const features = FEATURES[language];

  return (
    <section id="features" className="section bg-neutral-light">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="sub-heading mb-md">{t.featuresTitle}</h2>
          <p className="body-text max-w-2xl mx-auto">{t.featuresSubtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary mb-4 mx-auto">
                <div className="text-white text-2xl">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-neutral-dark mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
