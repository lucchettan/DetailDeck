import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import OnboardingWelcome from './OnboardingWelcome';
import ShopInfoStep from './onboarding/ShopInfoStep';
import ScheduleStep from './onboarding/ScheduleStep';
import CategoriesStep from './onboarding/CategoriesStep';
import VehicleSizesStep from './onboarding/VehicleSizesStep';
import ServiceEditorOnboarding from './onboarding/ServiceEditorOnboarding';

interface NewOnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'shop-info' | 'schedule' | 'categories' | 'vehicle-sizes' | 'services';

const NewOnboarding: React.FC<NewOnboardingProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const { logOut, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  // État centralisé pour toutes les données d'onboarding
  const [onboardingData, setOnboardingData] = useState({
    shopId: null as string | null,
    categories: [] as any[],
    vehicleSizes: [] as any[],
    services: [] as any[],
    loading: true
  });

  // État pour éviter les chargements multiples
  const [hasLoaded, setHasLoaded] = useState(false);

  // Charger les données une seule fois au début
  useEffect(() => {
    if (user && !hasLoaded) {
      setHasLoaded(true);
      loadOnboardingData();
    }
  }, [user, hasLoaded]);

  const loadOnboardingData = async () => {
    if (!user?.email) {
      console.log('❌ NewOnboarding: No user email found');
      return;
    }

    try {
      console.log('🔄 NewOnboarding: Loading data once...', { userEmail: user.email });

      // Récupérer le shop
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('email', user.email)
        .single();

      console.log('🔍 NewOnboarding: Shop query result:', { shopData, shopError });

      if (shopData) {
        // Récupérer les catégories
        const { data: categories } = await supabase
          .from('shop_service_categories')
          .select('*')
          .eq('shop_id', shopData.id);

        // Récupérer les tailles de véhicules
        const { data: vehicleSizes } = await supabase
          .from('shop_vehicle_sizes')
          .select('*')
          .eq('shop_id', shopData.id);

        // Récupérer les services
        const { data: services } = await supabase
          .from('services')
          .select('*')
          .eq('shop_id', shopData.id);

        setOnboardingData({
          shopId: shopData.id,
          categories: categories || [],
          vehicleSizes: vehicleSizes || [],
          services: services || [],
          loading: false
        });

        console.log('✅ NewOnboarding: Data loaded successfully');
      } else {
        console.log('⚠️ NewOnboarding: No shop found for user');
        setOnboardingData(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('❌ NewOnboarding: Error loading data:', error);
      setOnboardingData(prev => ({ ...prev, loading: false }));
    }
  };

  // Fonction pour mettre à jour les données après sauvegarde
  const updateOnboardingData = (type: 'categories' | 'vehicleSizes' | 'services', data: any[]) => {
    setOnboardingData(prev => ({
      ...prev,
      [type]: data
    }));
  };

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
            shopId={onboardingData.shopId}
            categories={onboardingData.categories}
            onDataUpdate={(data) => updateOnboardingData('categories', data)}
          />
        );

      case 'vehicle-sizes':
        return (
          <VehicleSizesStep
            onBack={handleBack}
            onNext={handleNext}
            shopId={onboardingData.shopId}
            vehicleSizes={onboardingData.vehicleSizes}
            onDataUpdate={(data) => updateOnboardingData('vehicleSizes', data)}
          />
        );

      case 'services':
        return (
          <ServiceEditorOnboarding
            onBack={handleBack}
            onNext={handleNext}
            shopId={onboardingData.shopId}
            categories={onboardingData.categories}
            vehicleSizes={onboardingData.vehicleSizes}
            onDataUpdate={(data) => updateOnboardingData('services', data)}
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
                onClick={logOut}
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

      {/* Message de redirection si données complètes */}
      {onboardingData.shopId && onboardingData.categories.length > 0 && onboardingData.vehicleSizes.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-4 mt-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>Configuration détectée !</strong> Vous avez déjà configuré votre entreprise. Redirection vers le dashboard...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="py-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default NewOnboarding;
