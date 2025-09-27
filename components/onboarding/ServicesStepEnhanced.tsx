import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { UnsavedChangesAlert } from '../common/UnsavedChangesAlert';
import ServiceEditorOnboarding from './ServiceEditorOnboarding';

interface ServicesStepEnhancedProps {
  onBack: () => void;
  onNext: () => void;
  shopId?: string | null;
  categories?: any[];
  services?: any[];
  vehicleSizes?: any[];
  onDataUpdate?: (data: any[]) => void;
}

interface Service {
  id?: string;
  name: string;
  description: string;
  category_id: string;
  base_price: number;
  base_duration: number;
  image_urls: string[];
  vehicle_size_variations?: { [key: string]: { price: number; duration: number } };
  specific_addons?: Array<{ name: string; price: number; duration: number }>;
}

interface Category {
  id: string;
  name: string;
}

const ServicesStepEnhanced: React.FC<ServicesStepEnhancedProps> = ({
  onBack,
  onNext,
  shopId: propShopId,
  categories: propCategories,
  services: propServices,
  vehicleSizes: propVehicleSizes,
  onDataUpdate
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Form persistence
  const {
    data: persistedServices,
    setData: setPersistedServices,
    updateData: updatePersistedServices,
    hasUnsavedChanges
  } = useFormPersistence<Service[]>({
    key: 'onboarding-services-enhanced',
    defaultData: []
  });

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicleSizes, setVehicleSizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 ServicesStepEnhanced: useEffect triggered');

    // Si on a des props, les utiliser directement
    if (propShopId && propCategories) {
      console.log('📦 ServicesStepEnhanced: Using props data');
      setShopId(propShopId);
      setCategories(propCategories);
      setVehicleSizes(propVehicleSizes || []);
      setInitialLoading(false);

      // Utiliser les services persistés ou les props
      if (persistedServices.length > 0) {
        console.log('📦 ServicesStepEnhanced: Loading persisted services:', persistedServices.length);
        // S'assurer que les services persistés ont des category_id valides
        const updatedPersistedServices = persistedServices.map(service => {
          if (!service.category_id || !propCategories.find(c => c.id === service.category_id)) {
            // Si category_id n'est pas valide, utiliser la première catégorie disponible
            return { ...service, category_id: propCategories[0]?.id || '' };
          }
          return service;
        });
        setServices(updatedPersistedServices);
        setPersistedServices(updatedPersistedServices); // Mettre à jour le localStorage
      } else if (propServices && propServices.length > 0) {
        console.log('📦 ServicesStepEnhanced: Loading prop services:', propServices.length);
        setServices(propServices);
      } else {
        // Créer des services par défaut avec la nouvelle structure
        const defaultServices = propCategories.map(category => ({
          name: category.name === 'Intérieur' ? 'Nettoyage intérieur complet' : 'Lavage extérieur',
          description: category.name === 'Intérieur'
            ? 'Aspirateur, nettoyage des sièges et tableau de bord'
            : 'Lavage carrosserie, jantes et vitres',
          category_id: category.id,
          base_price: category.name === 'Intérieur' ? 25 : 15,
          base_duration: category.name === 'Intérieur' ? 45 : 30,
          image_urls: [],
          vehicle_size_variations: {},
          specific_addons: []
        }));
        setServices(defaultServices);
      }
    } else {
      // Fallback: fetch si pas de props
      console.log('📦 ServicesStepEnhanced: Fetching data from API');
      fetchData();
    }
  }, [propShopId, propCategories, propServices, propVehicleSizes]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch shop data
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (shopError) throw shopError;
      setShopId(shopData.id);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('shop_service_categories')
        .select('id, name')
        .eq('shop_id', shopData.id)
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch vehicle sizes
      const { data: vehicleSizesData, error: vehicleSizesError } = await supabase
        .from('shop_vehicle_sizes')
        .select('id, name')
        .eq('shop_id', shopData.id);

      if (vehicleSizesError) throw vehicleSizesError;
      setVehicleSizes(vehicleSizesData || []);

      // Create default services if none exist
      if (categoriesData && categoriesData.length > 0) {
        const defaultServices = categoriesData.map(category => ({
          name: category.name === 'Intérieur' ? 'Nettoyage intérieur complet' : 'Lavage extérieur',
          description: category.name === 'Intérieur'
            ? 'Aspirateur, nettoyage des sièges et tableau de bord'
            : 'Lavage carrosserie, jantes et vitres',
          category_id: category.id,
          base_price: category.name === 'Intérieur' ? 25 : 15,
          base_duration: category.name === 'Intérieur' ? 45 : 30,
          image_urls: [],
          vehicle_size_variations: {},
          specific_addons: []
        }));
        setServices(defaultServices);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const updateService = (index: number, updatedService: Service) => {
    const newServices = [...services];
    newServices[index] = updatedService;
    setServices(newServices);
    updatePersistedServices(newServices);

    if (onDataUpdate) {
      onDataUpdate(newServices);
    }
  };

  const addService = () => {
    const newService: Service = {
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      base_price: 20,
      base_duration: 30,
      image_urls: [],
      vehicle_size_variations: {},
      specific_addons: []
    };
    const newServices = [...services, newService];
    setServices(newServices);
    updatePersistedServices(newServices);

    if (onDataUpdate) {
      onDataUpdate(newServices);
    }
  };

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
    updatePersistedServices(newServices);

    if (onDataUpdate) {
      onDataUpdate(newServices);
    }
  };

  const canProceed = () => {
    return services.every(service =>
      service.name.trim() &&
      service.category_id &&
      service.base_price > 0 &&
      service.base_duration > 0
    );
  };

  if (initialLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des données...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          Vous devez d'abord créer des catégories de services dans l'étape précédente.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Unsaved changes alert */}
      <UnsavedChangesAlert hasUnsavedChanges={hasUnsavedChanges()} />

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Créez vos services
        </h2>
        <p className="text-lg text-gray-600">
          Définissez les services que vous proposez avec leurs options et variations.
        </p>
      </div>

      <div className="space-y-6">
        {services.map((service, index) => (
          <ServiceEditorOnboarding
            key={index}
            service={service}
            serviceIndex={index}
            categories={categories}
            vehicleSizes={vehicleSizes}
            onUpdate={updateService}
            onRemove={removeService}
            canRemove={services.length > 1}
          />
        ))}

        {/* Add Service Button */}
        <div className="text-center">
          <button
            onClick={addService}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Ajouter un service
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default ServicesStepEnhanced;
