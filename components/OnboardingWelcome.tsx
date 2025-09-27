import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CheckCircleIcon, ChevronRightIcon, ShopIcon, ClockIcon, CategoryIcon, ServiceIcon, CarIcon } from './Icons';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

interface OnboardingWelcomeProps {
  onStepSelect: (stepId: string) => void;
  onComplete: () => void;
}

const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onStepSelect, onComplete }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user?.id) return;

    try {
      // Vérifier les informations du shop
      const { data: shop } = await supabase
        .from('shops')
        .select('id, name, address_line1, opening_hours')
        .eq('email', user.email)
        .single();

      // Vérifier les catégories de services
      const { data: categories } = await supabase
        .from('shop_service_categories')
        .select('id')
        .eq('shop_id', shop?.id);

      // Vérifier les services
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('shop_id', shop?.id);

      // Vérifier les tailles de véhicules
      const { data: vehicleSizes } = await supabase
        .from('shop_vehicle_sizes')
        .select('id')
        .eq('shop_id', shop?.id);

      const stepsData: OnboardingStep[] = [
        {
          id: 'shop-info',
          title: 'Informations de votre entreprise',
          description: 'Nom, adresse, téléphone et type d\'entreprise',
          icon: ShopIcon,
          completed: !!(shop?.name && shop?.address_line1),
          required: true
        },
        {
          id: 'schedule',
          title: 'Horaires d\'ouverture',
          description: 'Définissez vos disponibilités et règles de réservation',
          icon: ClockIcon,
          completed: !!(shop?.opening_hours),
          required: true
        },
        {
          id: 'categories',
          title: 'Catégories de services',
          description: 'Organisez vos services (Intérieur, Extérieur, etc.)',
          icon: CategoryIcon,
          completed: (categories?.length || 0) >= 1,
          required: true
        },
        {
          id: 'vehicle-sizes',
          title: 'Tailles de véhicules',
          description: 'Définissez les 4 tailles : Citadine, Berline, Break/SUV, 4x4/Minivan',
          icon: CarIcon,
          completed: (vehicleSizes?.length || 0) >= 1,
          required: true
        },
        {
          id: 'services',
          title: 'Vos premiers services',
          description: 'Ajoutez au moins un service dans chaque catégorie',
          icon: ServiceIcon,
          completed: (services?.length || 0) >= 1,
          required: true
        }
      ];

      setSteps(stepsData);

      // Vérifier si l'onboarding est complet
      const allRequired = stepsData.filter(s => s.required);
      const allCompleted = allRequired.every(s => s.completed);

      if (allCompleted) {
        setTimeout(onComplete, 1000);
      }

    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.filter(s => s.required).length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue sur Resaone ! 👋
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Configurons votre espace de travail en quelques étapes simples
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500">
          {completedSteps} sur {totalSteps} étapes complétées
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {steps.map((step) => {
          const IconComponent = step.icon;
          return (
            <div
              key={step.id}
              onClick={() => onStepSelect(step.id)}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg
                ${step.completed
                  ? 'border-green-200 bg-green-50 hover:border-green-300'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {!step.completed && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {steps.findIndex(s => s.id === step.id) + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="pr-12">
                <div className="flex items-center mb-3">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center mr-4
                    ${step.completed ? 'bg-green-100' : 'bg-gray-100'}
                  `}>
                    <IconComponent className={`w-6 h-6 ${step.completed ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                </div>

                <p className="text-gray-600 mb-4">
                  {step.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`
                    text-sm font-medium px-3 py-1 rounded-full
                    ${step.completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {step.completed ? '✅ Terminé' : '⏳ À faire'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {completedSteps < totalSteps && (
          <button
            onClick={() => {
              const nextStep = steps.find(s => !s.completed && s.required);
              if (nextStep) onStepSelect(nextStep.id);
            }}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Continuer la configuration
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}

        {completedSteps === totalSteps && (
          <button
            onClick={onComplete}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Accéder au tableau de bord
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingWelcome;
