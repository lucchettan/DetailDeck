import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import ServiceEditor from '../dashboard/ServiceEditor';
import { Service, Formula, VehicleSizeSupplement, AddOn, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';

interface ServiceEditorOnboardingProps {
  onBack: () => void;
  onNext: () => void;
  shopId?: string | null;
  categories?: any[];
  vehicleSizes?: any[];
  onDataUpdate?: (data: any[]) => void;
}

const ServiceEditorOnboarding: React.FC<ServiceEditorOnboardingProps> = ({
  onBack,
  onNext,
  shopId: propShopId,
  categories: propCategories,
  vehicleSizes: propVehicleSizes,
  onDataUpdate
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [shopId, setShopId] = useState<string | null>(null);
  const [categories, setCategories] = useState<ShopServiceCategory[]>([]);
  const [vehicleSizes, setVehicleSizes] = useState<ShopVehicleSize[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string>('new');

  useEffect(() => {
    if (propShopId && propCategories && propVehicleSizes) {
      setShopId(propShopId);
      setCategories(propCategories);
      setVehicleSizes(propVehicleSizes);
      loadExistingServices(propShopId);
    } else {
      fetchShopData();
    }
  }, [propShopId, propCategories, propVehicleSizes]);

  const fetchShopData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('email', user.email)
        .single();

      if (shopData) {
        setShopId(shopData.id);
        await Promise.all([
          loadCategories(shopData.id),
          loadVehicleSizes(shopData.id),
          loadExistingServices(shopData.id)
        ]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (shopId: string) => {
    const { data } = await supabase
      .from('shop_service_categories')
      .select('*')
      .eq('shop_id', shopId);
    setCategories(data || []);
  };

  const loadVehicleSizes = async (shopId: string) => {
    const { data } = await supabase
      .from('shop_vehicle_sizes')
      .select('*')
      .eq('shop_id', shopId);
    setVehicleSizes(data || []);
  };

  const loadExistingServices = async (shopId: string) => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('shop_id', shopId);
    setServices(data || []);
  };

  const handleCreateService = () => {
    setEditingServiceId('new');
    setShowServiceEditor(true);
  };

  const handleEditService = (serviceId: string) => {
    setEditingServiceId(serviceId);
    setShowServiceEditor(true);
  };

  const handleServiceEditorBack = () => {
    setShowServiceEditor(false);
  };

  const handleServiceEditorSave = async () => {
    setShowServiceEditor(false);
    if (shopId) {
      await loadExistingServices(shopId);
    }
  };

  const handleServiceEditorDelete = async () => {
    setShowServiceEditor(false);
    if (shopId) {
      await loadExistingServices(shopId);
    }
  };

  const handleContinue = () => {
    if (onDataUpdate && services.length > 0) {
      onDataUpdate(services);
    }
    onNext();
  };

  if (showServiceEditor && shopId) {
    const serviceData = services.find(s => s.id === editingServiceId);
    
    return (
      <ServiceEditor
        serviceId={editingServiceId}
        shopId={shopId}
        supportedVehicleSizes={[]} // Deprecated
        vehicleSizes={vehicleSizes}
        serviceCategories={categories}
        onBack={handleServiceEditorBack}
        onSave={handleServiceEditorSave}
        onDelete={handleServiceEditorDelete}
        initialData={serviceData ? {
          ...serviceData,
          formulas: [],
          supplements: [],
          specificAddOns: []
        } : null}
      />
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">
            Vous devez d'abord créer des catégories de services dans l'étape précédente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Créer votre premier service
        </h2>
        <p className="text-gray-600">
          Définissez votre premier service avec toutes ses options. Vous pourrez en ajouter d'autres plus tard.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
        <div className="mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Vos services</h3>
          </div>
        </div>
        <p className="text-gray-600 mb-6">Créez votre premier service avec toutes ses options (formules, tailles, add-ons)</p>

        {services.length > 0 ? (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Prix: {service.base_price}€</span>
                      <span>Durée: {service.base_duration}min</span>
                      <span>Catégorie: {categories.find(c => c.id === service.category_id)?.name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditService(service.id!)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={handleCreateService}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter un autre service
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mb-6">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun service créé</h4>
              <p className="text-gray-600 mb-6">
                Créez votre premier service pour commencer à recevoir des réservations
              </p>
            </div>
            
            <button
              onClick={handleCreateService}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer mon premier service
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Retour
        </button>
        
        <button
          onClick={handleContinue}
          disabled={services.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {services.length === 0 ? 'Créez un service pour continuer' : 'Terminer l\'onboarding →'}
        </button>
      </div>
    </div>
  );
};

export default ServiceEditorOnboarding;