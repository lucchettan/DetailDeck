
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { StorefrontIcon, ClockIcon, TagIcon, CheckIcon } from '../Icons';

interface DashboardHomeProps {
  onNavigate: (view: string) => void;
  setupStatus: {
    shopInfo: boolean;
    availability: boolean;
    catalog: boolean;
  };
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, setupStatus }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const steps = [
    { 
      id: 'shop',
      title: t.setupShopInfo, 
      icon: <StorefrontIcon className="w-8 h-8 text-brand-blue" />, 
      isComplete: setupStatus.shopInfo 
    },
    { 
      id: 'shop',
      title: t.setupAvailability, 
      icon: <ClockIcon className="w-8 h-8 text-brand-blue" />, 
      isComplete: setupStatus.availability
    },
    { 
      id: 'catalog',
      title: t.addFirstService, 
      icon: <TagIcon className="w-8 h-8 text-brand-blue" />, 
      isComplete: setupStatus.catalog
    },
  ];

  // FIX: Create a strongly-typed array of keys for accessing translations.
  // This avoids building a key dynamically from a `number` index, which prevents
  // TypeScript from inferring the correct string type for the translation.
  const stepLabels = ['step1', 'step2', 'step3'] as const;

  return (
    <div>
      <h2 className="text-3xl font-bold text-brand-dark mb-4">
        {t.dashboardGreeting} {user?.user_metadata.first_name || ''}
      </h2>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-brand-dark mb-1">{t.getStartedGuide}</h3>
        <p className="text-brand-gray mb-6">Complete these steps to get your booking page ready.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <button 
              key={step.id + index}
              onClick={() => onNavigate(step.id)}
              className={`relative bg-brand-light p-6 rounded-lg text-left border transition-all duration-300 ${step.isComplete ? 'border-green-500' : 'border-gray-200 hover:shadow-lg hover:border-brand-blue'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                    {step.icon}
                </div>
              </div>
              <p className="text-brand-gray font-semibold text-sm">{t[stepLabels[index]]}</p>
              <h4 className="text-lg font-bold text-brand-dark mt-1">{step.title}</h4>
               {step.isComplete && (
                <div className="absolute bottom-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white shadow-lg">
                  <CheckIcon className="w-5 h-5" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;