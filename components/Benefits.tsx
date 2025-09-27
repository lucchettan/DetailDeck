import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CustomServicesIcon, AutomatedBookingIcon, ManagedCalendarIcon } from './Icons';

const Benefits: React.FC = () => {
  const { t } = useLanguage();

  const benefitsData = [
    { icon: <CustomServicesIcon className="w-10 h-10 text-brand-blue" />, title: t.benefit1 },
    { icon: <AutomatedBookingIcon className="w-10 h-10 text-brand-blue" />, title: t.benefit2 },
    { icon: <ManagedCalendarIcon className="w-10 h-10 text-brand-blue" />, title: t.benefit3 },
  ];

  return (
    <section id="benefits" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {benefitsData.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border border-blue-100">
              <div className="flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-brand-dark max-w-xs">{benefit.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
