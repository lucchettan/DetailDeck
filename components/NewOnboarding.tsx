import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import OnboardingWelcome from './OnboardingWelcome';
import ShopInfoStep from './onboarding/ShopInfoStep';
import ScheduleStep from './onboarding/ScheduleStep';
import CategoriesStep from './onboarding/CategoriesStep';
import VehicleSizesStep from './onboarding/VehicleSizesStep';
import ServicesStep from './onboarding/ServicesStep';

interface NewOnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'shop-info' | 'schedule' | 'categories' | 'vehicle-sizes' | 'services';

const NewOnboarding: React.FC<NewOnboardingProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  const handleStepSelect = (stepId: string) => {
    setCurrentStep(stepId as OnboardingStep);
  };

  const handleBack = () => {
    setCurrentStep('welcome');
  };

  const handleNext = () => {
    // Logique pour passer à l'étape suivante
    switch (currentStep) {
      case 'shop-info':
        setCurrentStep('schedule');
        break;
      case 'schedule':
        setCurrentStep('categories');
        break;
      case 'categories':
        setCurrentStep('vehicle-sizes');
        break;
      case 'vehicle-sizes':
        setCurrentStep('services');
        break;
      case 'services':
        setCurrentStep('welcome'); // Retour à l'accueil pour vérification
        break;
      default:
        setCurrentStep('welcome');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <OnboardingWelcome
            onStepSelect={handleStepSelect}
            onComplete={onComplete}
          />
        );

      case 'shop-info':
        return (
          <ShopInfoStep
            onBack={handleBack}
            onNext={handleNext}
          />
        );

      case 'schedule':
        return (
          <ScheduleStep
            onBack={handleBack}
            onNext={handleNext}
          />
        );

      case 'categories':
        return (
          <CategoriesStep
            onBack={handleBack}
            onNext={handleNext}
          />
        );

      case 'vehicle-sizes':
        return (
          <VehicleSizesStep
            onBack={handleBack}
            onNext={handleNext}
          />
        );

      case 'services':
        return (
          <ServicesStep
            onBack={handleBack}
            onNext={handleNext}
          />
        );

      default:
        return <OnboardingWelcome onStepSelect={handleStepSelect} onComplete={onComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation toujours visible */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Resaone</h1>
              {currentStep !== 'welcome' && (
                <span className="ml-4 text-sm text-gray-500">
                  Configuration initiale
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={onComplete}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Ignorer l'onboarding
              </button>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Se déconnecter
              </button>
            </div>

            {/* Progress indicator */}
            {currentStep !== 'welcome' && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {['shop-info', 'schedule', 'categories', 'vehicle-sizes', 'services'].map((step, index) => (
                    <div
                      key={step}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                        ${step === currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default NewOnboarding;
