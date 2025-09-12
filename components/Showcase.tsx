import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Showcase: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-brand-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">{t.showcaseTitle}</h2>
          <p className="text-lg text-brand-gray mt-4 max-w-2xl mx-auto">{t.showcaseSubtitle}</p>
        </div>
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-2 border border-gray-200">
          <div className="flex items-center space-x-1.5 p-2 border-b border-gray-200">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <img src="https://picsum.photos/seed/dashboard/1200/800" alt="SaaS Dashboard Showcase" className="w-full h-auto rounded-b-lg"/>
        </div>
      </div>
    </section>
  );
};

export default Showcase;