import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Service } from '../Dashboard';
import { PlusIcon, ImageIcon, MoneyIcon, CogIcon as SettingsIcon, CarIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import { toCamelCase } from '../../lib/utils';

import { ShopServiceCategory } from '../../types';

interface CatalogProps {
  shopId: string;
  onEditService: (serviceId: string) => void;
  onAddNewService: (categoryId?: string) => void;
  onOpenVehicleSizeManager?: () => void;
  onOpenCategoryManager?: () => void;
  onOpenCatalogSettings?: () => void;
  initialServices?: Service[];
  serviceCategories?: ShopServiceCategory[];
  onNavigateHome?: () => void;
  refreshTrigger?: number; // Pour forcer le rafraîchissement
}

const CACHE_DURATION = 30 * 1000; // 30 secondes

const Catalog: React.FC<CatalogProps> = ({ shopId, onEditService, onAddNewService, onOpenVehicleSizeManager, onOpenCategoryManager, onOpenCatalogSettings, initialServices, serviceCategories: shopServiceCategories = [], onNavigateHome, refreshTrigger }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>(shopServiceCategories[0]?.id || 'default');
  const [services, setServices] = useState<Service[]>(initialServices || []);
  const [loading, setLoading] = useState(!initialServices);
  const [lastFetched, setLastFetched] = useState<number | null>(initialServices ? Date.now() : null);

  // Mettre à jour les services quand initialServices change
  useEffect(() => {
    if (initialServices) {
      setServices(initialServices);
    }
  }, [initialServices]);

  const fetchServices = useCallback(async (force = false) => {
    if (initialServices && !force) return;
    if (!shopId) return;

    const now = Date.now();
    if (!force && lastFetched && (now - lastFetched < CACHE_DURATION)) {
      return; // Use cached data, do not trigger loading state.
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('shop_id', shopId);

    if (error) {
      console.error("Error fetching services:", error);
    } else if (data) {
      setServices(toCamelCase(data) as Service[]);
      setLastFetched(Date.now());
    }
    setLoading(false);
  }, [shopId, initialServices, lastFetched]);

  useEffect(() => {
    fetchServices();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchServices]);

  // Rafraîchir quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger) {
      fetchServices(true); // Force refresh
    }
  }, [refreshTrigger, fetchServices]);

  // Group services by category dynamically
  const servicesByCategory = useMemo(() => {
    // Grouping services by category
    // Categories and services data

    const grouped: Record<string, Service[]> = {};
    shopServiceCategories.forEach(category => {
      const categoryServices = services.filter(service => service.categoryId === category.id);
      // Category services
      grouped[category.id] = categoryServices;
    });

    // Grouped services
    return grouped;
  }, [services, shopServiceCategories]);

  // Get current category info
  const currentCategory = shopServiceCategories.find(cat => cat.id === activeTab);
  const currentServices = servicesByCategory[activeTab] || [];

  const ServiceList: React.FC<{
    serviceList: Service[];
    onAdd: () => void;
    addText: string;
  }> = ({ serviceList, onAdd, addText }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <button
        onClick={onAdd}
        className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300 text-gray-600 hover:text-neutral-dark min-h-[280px]"
      >
        <PlusIcon className="w-10 h-10 mb-2" />
        <span className="font-bold text-lg text-center">{addText}</span>
      </button>

      {serviceList.map(service => (
        <div
          key={service.id}
          onClick={() => onEditService(service.id)}
          className="card cursor-pointer flex flex-col overflow-hidden border border-gray-200 hover:border-primary"
        >
          {(service.imageUrls && service.imageUrls.length > 0) ? (
            <div className="h-40 w-full">
              <img src={service.imageUrls[0]} alt={service.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-40 w-full bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
          <div className="p-6 flex flex-col flex-grow">
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-neutral-dark pr-2">{service.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {service.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className="text-gray-600 mt-2 text-sm min-h-[40px] line-clamp-2">{service.description}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
              <MoneyIcon className="w-6 h-6 text-gray-400" />
              <p className="text-xl font-bold text-neutral-dark">
                {t.fromPrice.replace('{price}', String(service.basePrice || 0))}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Bouton retour à l'accueil */}
      <div className="mb-4">
        <button
          onClick={onNavigateHome || (() => window.history.back())}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l'accueil
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark">{t.catalog}</h2>
          <p className="text-gray-600 mt-1">{t.manageServicesSubtitle}</p>
        </div>
      </div>

      <div className="card p-6 md:p-8">
        <div className="border-b border-gray-200 mb-6">
          <div className="flex justify-between items-center">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              {shopServiceCategories.map(category => {
                const isActive = activeTab === category.id;
                const categoryServices = servicesByCategory[category.id] || [];
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors
                                  ${isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-600 hover:text-neutral-dark hover:border-gray-300'
                      }`
                    }
                  >
                    <span className="text-lg">{category.iconName === 'interior' ? '🏠' : category.iconName === 'exterior' ? '✨' : '🔧'}</span>
                    {category.name}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                      {categoryServices.length}
                    </span>
                  </button>
                )
              })}

              {/* Add Category Button */}
              <button
                onClick={() => onOpenCategoryManager?.()}
                className="whitespace-nowrap py-4 px-1 border-b-2 border-transparent font-semibold text-sm flex items-center gap-2 transition-colors text-gray-500 hover:text-primary hover:border-gray-300"
                title="Gérer vos catégories"
              >
                <span className="text-lg">⚙️</span>
                <span>Gérer vos catégories</span>
              </button>
            </nav>

            {/* Vehicle Sizes Button */}
            <button
              onClick={() => onOpenVehicleSizeManager?.()}
              className="whitespace-nowrap py-4 px-1 border-b-2 border-transparent font-semibold text-sm flex items-center gap-2 transition-colors text-gray-500 hover:text-primary hover:border-gray-300"
              title="Gérer les tailles de véhicules"
            >
              <span className="text-lg">🚗</span>
              <span>Tailles de véhicules</span>
            </button>
          </div>
        </div>

        <div>
          <ServiceList
            serviceList={currentServices}
            onAdd={() => onAddNewService(activeTab)}
            addText={currentCategory?.name ? `Créer un service ${currentCategory.name.toLowerCase()}` : t.addNewService}
          />
        </div>
      </div>
    </div>
  );
};

export default Catalog;
