
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Analytics: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.analytics}</h2>
      <p className="text-brand-gray mb-6">Explore your results.</p>
      
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h3 className="text-xl font-semibold text-brand-dark">Coming Soon!</h3>
        <p className="text-brand-gray mt-2">
          Detailed analytics and financial reports will be available here to help you track your business growth.
        </p>
      </div>
    </div>
  );
};

export default Analytics;
