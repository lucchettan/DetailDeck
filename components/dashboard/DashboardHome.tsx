
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { StorefrontIcon, ClockIcon, ListBulletIcon, CheckIcon, LinkIcon, ShareIcon, EyeIcon } from '../Icons';
import { Shop } from '../Dashboard';

interface DashboardHomeProps {
  onNavigate: (nav: { view: string; step?: number }) => void;
  // FIX: Changed props from `setupStatus` and `shopId` to `shopData` and `hasServices`
  // to make the component more self-contained and simplify the parent's logic.
  shopData: Shop;
  hasServices: boolean;
  onPreview: () => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, shopData, hasServices, onPreview }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);

  // Use the real shop ID if available, otherwise fallback for safety.
  const bookingUrl = `${window.location.origin}/reservation/${shopData.id || 'no-shop-found'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const setupStatus = {
    shopInfo: !!(shopData.name && shopData.addressLine1),
    availability: !!shopData.schedule,
    categories: false, // TODO: récupérer le nombre réel de catégories
    vehicleSizes: false, // TODO: récupérer le nombre réel de tailles
    services: hasServices
  };

  const steps = [
    {
      id: 'settings',
      step: 1,
      title: 'Informations de votre entreprise',
      description: 'Nom, adresse, téléphone et type d\'entreprise',
      icon: <StorefrontIcon className="w-8 h-8" />,
      isComplete: setupStatus.shopInfo
    },
    {
      id: 'settings',
      step: 2,
      title: 'Horaires d\'ouverture',
      description: 'Définissez vos disponibilités et règles de réservation',
      icon: <ClockIcon className="w-8 h-8" />,
      isComplete: setupStatus.availability
    },
    {
      id: 'catalog',
      step: 3,
      title: 'Catégories de services',
      description: 'Organisez vos services (Intérieur, Extérieur, etc.)',
      icon: <ListBulletIcon className="w-8 h-8" />,
      isComplete: setupStatus.categories
    },
    {
      id: 'catalog',
      step: 4,
      title: 'Tailles de véhicules',
      description: 'Définissez les 4 tailles : Citadine, Berline, Break/SUV, 4x4/Minivan',
      icon: <StorefrontIcon className="w-8 h-8" />,
      isComplete: setupStatus.vehicleSizes
    }
  ];

  // Labels pour les 4 étapes
  const stepLabels = ['Étape 1', 'Étape 2', 'Étape 3', 'Étape 4'] as const;

  // Vérifier si toutes les étapes sont complètes
  const allStepsComplete = steps.every(step => step.isComplete);

  // Composant de l'onboarding
  const OnboardingSection = () => (
    <div className="bg-white p-8 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-bold text-brand-dark mb-1">
        {allStepsComplete ? '✅ Configuration terminée !' : t.getStartedGuide}
      </h3>
      <p className="text-brand-gray mb-6">
        {allStepsComplete
          ? 'Félicitations ! Votre boutique est prête à recevoir des réservations.'
          : 'Complete these steps to get your booking page ready.'
        }
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => (
          <div
            key={step.id + index}
            onClick={() => onNavigate({ view: step.id, step: step.step })}
            className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg
                ${step.isComplete
                ? 'border-green-200 bg-green-50 hover:border-green-300'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }
              `}
          >
            {/* Content */}
            <div>
              <div className="flex items-center mb-3">
                {!step.isComplete && (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 text-lg font-bold bg-gray-200 text-gray-600">
                    {index + 1}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                {step.description}
              </p>

              <div className="flex items-center justify-between">
                <span className={`
                    text-sm font-medium px-3 py-1 rounded-full
                    ${step.isComplete
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                  }
                  `}>
                  {step.isComplete ? '✅ Terminé' : '⏳ À faire'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Composant de la page de réservation
  const BookingPageSection = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-brand-dark mb-1">{t.yourBookingPage}</h3>
      <p className="text-brand-gray mb-4">{t.yourBookingPageSubtitle}</p>
      <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
        <p className="text-brand-blue font-mono text-sm overflow-x-auto whitespace-nowrap">{bookingUrl}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={copyToClipboard} className="flex-1 min-w-[120px] btn btn-secondary flex items-center justify-center gap-2">
          <LinkIcon className="w-5 h-5" />
          <span>{linkCopied ? t.linkCopied : t.copyLink}</span>
        </button>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px] btn btn-secondary flex items-center justify-center gap-2">
          {t.openLink}
        </a>
        <button onClick={onPreview} className="flex-1 min-w-[120px] btn btn-secondary flex items-center justify-center gap-2">
          <EyeIcon className="w-5 h-5" />
          <span>{t.previewPage}</span>
        </button>
        <button className="flex-1 min-w-[120px] btn btn-secondary flex items-center justify-center gap-2">
          <ShareIcon className="w-5 h-5" />
          <span>{t.share}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-brand-dark mb-4">
        {t.dashboardGreeting} {user?.user_metadata.first_name || ''}
      </h2>

      {/* Afficher la page de réservation en premier si l'onboarding est terminé */}
      {allStepsComplete && <BookingPageSection />}

      {/* Afficher l'onboarding en haut si pas terminé, en bas si terminé */}
      {!allStepsComplete && <OnboardingSection />}

      {/* Afficher la page de réservation en bas si l'onboarding n'est pas terminé */}
      {!allStepsComplete && <BookingPageSection />}

      {/* Afficher l'onboarding en bas si terminé (version compacte) */}
      {allStepsComplete && (
        <div className="mt-8">
          <OnboardingSection />
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
