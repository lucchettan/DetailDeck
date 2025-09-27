import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Service, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';
import { TrashIcon } from '@heroicons/react/24/outline';

interface ServiceEditorOnboardingProps {
  onBack: () => void;
  onNext: () => void;
  shopId?: string | null;
  categories?: any[];
  vehicleSizes?: any[];
  onDataUpdate?: (data: any[]) => void;
}

interface ServiceFormData {
  name: string;
  description: string;
  category_id: string;
  base_price: number;
  base_duration: number;
  image_urls: string[];
  vehicle_size_variations: { [key: string]: { price: number; duration: number } };
  specific_addons: Array<{ name: string; price: number; duration: number; description?: string }>;
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
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  // Formulaire de service
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category_id: '',
    base_price: 0,
    base_duration: 30,
    image_urls: [],
    vehicle_size_variations: {},
    specific_addons: []
  });

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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      base_price: 0,
      base_duration: 30,
      image_urls: [],
      vehicle_size_variations: {},
      specific_addons: []
    });
    setEditingService(null);
  };

  const handleCreateService = () => {
    resetForm();
    setShowServiceForm(true);
  };

  const handleEditService = (service: Service) => {
    setFormData({
      name: service.name || '',
      description: service.description || '',
      category_id: service.category_id || categories[0]?.id || '',
      base_price: service.base_price || 0,
      base_duration: service.base_duration || 30,
      image_urls: service.image_urls || [],
      vehicle_size_variations: service.vehicle_size_variations || {},
      specific_addons: service.specific_addons || []
    });
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    if (!shopId || !formData.name.trim() || !formData.category_id || formData.base_price <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        shop_id: shopId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        base_price: formData.base_price,
        base_duration: formData.base_duration,
        image_urls: formData.image_urls,
        vehicle_size_variations: formData.vehicle_size_variations,
        specific_addons: formData.specific_addons
      };

      if (editingService) {
        // Mettre à jour
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
        
        if (error) throw error;
      } else {
        // Créer
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);
        
        if (error) throw error;
      }

      await loadExistingServices(shopId);
      setShowServiceForm(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
      
      await loadExistingServices(shopId!);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du service');
    }
  };

  const handleContinue = () => {
    if (onDataUpdate && services.length > 0) {
      onDataUpdate(services);
    }
    onNext();
  };

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
          Définissez votre premier service. Vous pourrez en ajouter d'autres plus tard.
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
        <p className="text-gray-600 mb-6">Créez votre premier service avec les informations de base</p>

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditService(service)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id!)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {showServiceForm && (
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {editingService ? 'Modifier le service' : 'Nouveau service'}
                </h4>
              </div>

              <div className="space-y-4">
                {/* Nom du service */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Nettoyage intérieur complet"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Décrivez ce que comprend ce service..."
                  />
                </div>

                {/* Catégorie, Prix, Durée */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Catégorie *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Prix de base (€) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="20.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Durée (minutes) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.base_duration}
                      onChange={(e) => setFormData({ ...formData, base_duration: parseInt(e.target.value) || 30 })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowServiceForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveService}
                    disabled={saving || !formData.name.trim() || !formData.category_id || formData.base_price <= 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : null}
                    {editingService ? 'Mettre à jour' : 'Créer le service'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showServiceForm && (
            <button
              onClick={handleCreateService}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {services.length === 0 ? 'Créer votre premier service' : 'Ajouter un autre service'}
            </button>
          )}
        </div>
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