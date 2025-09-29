import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { UnsavedChangesAlert } from '../common/UnsavedChangesAlert';
import ServiceEditorOnboarding from './ServiceEditorOnboarding';
import { ImageIcon } from '../Icons';

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
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<string | null>(null);

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
        // Ne pas créer de services par défaut - laisser vide
        setServices([]);
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
    // Fermer le mode édition après mise à jour
    setSelectedCategoryForAdd(null);
  };

  const addService = (categoryId: string) => {
    const newService: Service = {
      name: '',
      description: '',
      category_id: categoryId,
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

    // Ouvrir le mode édition pour cette catégorie
    setSelectedCategoryForAdd(categoryId);
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

  // Grouper les services par catégorie
  const servicesByCategory = categories.reduce((acc, category) => {
    acc[category.id] = services.filter(s => s.category_id === category.id);
    return acc;
  }, {} as { [key: string]: Service[] });

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

  // Mode édition : afficher ServiceEditorOnboarding
  if (selectedCategoryForAdd) {
    const editingServiceIndex = services.findIndex(
      s => s.category_id === selectedCategoryForAdd && !s.name.trim()
    );
    const editingService = editingServiceIndex >= 0 ? services[editingServiceIndex] : null;

    if (editingService) {
      return (
        <div className="max-w-6xl mx-auto p-6">
          <UnsavedChangesAlert hasUnsavedChanges={hasUnsavedChanges()} />

          <ServiceEditorOnboarding
            service={editingService}
            serviceIndex={editingServiceIndex}
            categories={categories}
            vehicleSizes={vehicleSizes}
            onUpdate={updateService}
            onRemove={(idx) => {
              removeService(idx);
              setSelectedCategoryForAdd(null);
            }}
            canRemove={true}
            onCancel={() => {
              removeService(editingServiceIndex);
              setSelectedCategoryForAdd(null);
            }}
          />
        </div>
      );
    }
  }

  // Mode résumé : afficher les services groupés par catégorie
  return (
    <div className="max-w-6xl mx-auto p-6">
      <UnsavedChangesAlert hasUnsavedChanges={hasUnsavedChanges()} />

      {/* Services groupés par catégorie */}
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryServices = servicesByCategory[category.id] || [];

          return (
            <div key={category.id} className="bg-blue-50 rounded-xl p-8 border-2 border-blue-100">
              {/* En-tête de catégorie */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-2xl">
                    {category.name.toLowerCase().includes('intérieur') ? '🏠' :
                      category.name.toLowerCase().includes('extérieur') ? '✨' : '🔧'}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {categoryServices.length === 0
                      ? 'Aucun service pour le moment'
                      : `${categoryServices.length} service${categoryServices.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>

              {/* Grid de services */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Bouton ajouter */}
                <button
                  onClick={() => addService(category.id)}
                  className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600 min-h-[200px]"
                >
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-semibold text-center">Ajouter un service</span>
                </button>

                {/* Cards de services */}
                {categoryServices.map((service, idx) => {
                  const globalIndex = services.findIndex(s => s === service);
                  return (
                    <div
                      key={globalIndex}
                      onClick={() => setSelectedCategoryForAdd(category.id)}
                      className="cursor-pointer flex flex-col overflow-hidden border-2 border-gray-200 hover:border-blue-400 rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                    >
                      {/* Image */}
                      {service.image_urls && service.image_urls.length > 0 ? (
                        <img
                          src={service.image_urls[0]}
                          alt={service.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-300" />
                        </div>
                      )}

                      {/* Contenu */}
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{service.name}</h4>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex-shrink-0 ml-2">
                            Actif
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">{service.description}</p>
                        )}
                        <div className="mt-auto pt-4 border-t border-gray-200">
                          <p className="text-xl font-bold text-gray-900">
                            Dès {service.base_price} €
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Durée: {service.base_duration}min
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center gap-2"
        >
          ← Retour
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          Terminer l'onboarding →
        </button>
      </div>
    </div>
  );
};

export default ServicesStepEnhanced;
