
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Reservations: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.reservations}</h2>
      <p className="text-brand-gray mb-6">Explore and manage your reservations.</p>
      
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h3 className="text-xl font-semibold text-brand-dark">Coming Soon!</h3>
        <p className="text-brand-gray mt-2">
          This is where you'll be able to view, manage, and filter all your client bookings.
        </p>
      </div>
    </div>
  );
};

export default Reservations;
