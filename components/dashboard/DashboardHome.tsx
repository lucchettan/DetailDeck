

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { StorefrontIcon, ClockIcon, TagIcon, CheckIcon, LinkIcon, ShareIcon } from '../Icons';

interface DashboardHomeProps {
  onNavigate: (view: string) => void;
  setupStatus: {
    shopInfo: boolean;
    availability: boolean;
    catalog: boolean;
  };
  shopId?: string;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, setupStatus, shopId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);

  // Use the real shop ID if available, otherwise fallback for safety.
  const bookingUrl = `${window.location.origin}/reservation/${shopId || 'no-shop-found'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
  
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
  const stepLabels = ['step1', 'step2', 'step3'] as const;

  return (
    <div>
      <h2 className="text-3xl font-bold text-brand-dark mb-4">
        {t.dashboardGreeting} {user?.user_metadata.first_name || ''}
      </h2>
      
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold text-brand-dark mb-1">{t.getStartedGuide}</h3>
        <p className="text-brand-gray mb-6">Complete these steps to get your booking page ready.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <button 
              key={step.id + index}
              onClick={() => onNavigate(step.id)}
              className={`relative bg-brand-light p-6 rounded-lg text-left border-2 transition-all duration-300 ${step.isComplete ? 'border-green-500' : 'border-gray-200 hover:shadow-lg hover:border-brand-blue'}`}
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

      <div className="bg-white p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-brand-dark mb-1">{t.yourBookingPage}</h3>
        <p className="text-brand-gray mb-4">{t.yourBookingPageSubtitle}</p>
        <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
          <p className="text-brand-blue font-mono text-sm overflow-x-auto whitespace-nowrap">{bookingUrl}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={copyToClipboard} className="flex-1 min-w-[120px] bg-gray-200 text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
            <LinkIcon className="w-5 h-5"/>
            <span>{linkCopied ? t.linkCopied : t.copyLink}</span>
          </button>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px] bg-gray-200 text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
            {t.openLink}
          </a>
          <button className="flex-1 min-w-[120px] bg-gray-200 text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
            <ShareIcon className="w-5 h-5" />
            <span>{t.share}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
