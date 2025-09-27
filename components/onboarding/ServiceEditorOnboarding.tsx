import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Service, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { processImageFile } from '../../lib/heicUtils';

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
  formulas: Array<{
    name: string;
    additionalPrice: number;
    additionalDuration: number;
    includedItems: string[]
  }>;
  specific_addons: Array<{
    name: string;
    price: number;
    duration: number;
    description?: string
  }>;
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
  const [uploadingImages, setUploadingImages] = useState(false);

  // Formulaire de service
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category_id: '',
    base_price: 0,
    base_duration: 30,
    image_urls: [],
    vehicle_size_variations: {},
    formulas: [{ name: 'Basique', additionalPrice: 0, additionalDuration: 0, includedItems: [] }],
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
    // Charger les services
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('shop_id', shopId);

    if (!servicesData) {
      setServices([]);
      return;
    }

    // Charger tous les add-ons pour ces services
    const serviceIds = servicesData.map(s => s.id);
    const { data: addonsData } = await supabase
      .from('addons')
      .select('*')
      .in('service_id', serviceIds)
      .eq('is_active', true);

    // Grouper les add-ons par service_id
    const addonsByService: Record<string, any[]> = {};
    (addonsData || []).forEach(addon => {
      if (!addonsByService[addon.service_id]) {
        addonsByService[addon.service_id] = [];
      }
      addonsByService[addon.service_id].push(addon);
    });

    // Transformer les données pour inclure les add-ons dans chaque service
    const servicesWithAddOns = servicesData.map(service => ({
      ...service,
      specific_addons: addonsByService[service.id] || []
    }));

    console.log('Services chargés avec add-ons:', servicesWithAddOns);
    setServices(servicesWithAddOns);
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
      formulas: [{ name: 'Basique', additionalPrice: 0, additionalDuration: 0, includedItems: [] }],
      specific_addons: []
    });
    setEditingService(null);
  };

  const handleCreateService = () => {
    resetForm();
    setShowServiceForm(true);
  };

  const handleEditService = (service: Service) => {
    console.log('Service à éditer:', service);
    console.log('Add-ons du service:', service.specific_addons);

    // Transformer les add-ons pour le formulaire
    const addOnsForForm = (service.specific_addons || []).map(addon => ({
      name: addon.name || '',
      price: addon.price || 0,
      duration: addon.duration || 0,
      description: addon.description || ''
    }));

    console.log('Add-ons transformés pour le formulaire:', addOnsForForm);

    setFormData({
      name: service.name || '',
      description: service.description || '',
      category_id: service.category_id || categories[0]?.id || '',
      base_price: service.base_price || 0,
      base_duration: service.base_duration || 30,
      image_urls: service.image_urls || [],
      vehicle_size_variations: service.vehicle_size_variations || {},
      formulas: service.formulas || [{ name: 'Basique', additionalPrice: 0, additionalDuration: 0, includedItems: [] }],
      specific_addons: addOnsForForm
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
        formulas: formData.formulas
        // Note: specific_addons ne sont pas stockés dans la table services
        // Ils sont gérés séparément dans la table addons
      };

      let serviceId: string;

      if (editingService) {
        // Mettre à jour
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        serviceId = editingService.id;
      } else {
        // Créer
        const { data, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select('id')
          .single();

        if (error) throw error;
        serviceId = data.id;
      }

      // Gérer les add-ons spécifiques dans la table addons
      console.log('🔍 [DEBUG] formData.specific_addons:', formData.specific_addons);
      console.log('🔍 [DEBUG] formData.specific_addons.length:', formData.specific_addons.length);
      
      // Filtrer les add-ons valides (avec un nom non vide)
      const validAddOns = formData.specific_addons.filter(addon => addon.name && addon.name.trim() !== '');
      console.log('🔍 [DEBUG] Add-ons valides après filtrage:', validAddOns);
      
      if (validAddOns.length > 0) {
        console.log('🔍 [DEBUG] Sauvegarde des add-ons...');
        
        // Supprimer les anciens add-ons si on édite
        if (editingService) {
          console.log('🔍 [DEBUG] Suppression des anciens add-ons pour service:', serviceId);
          await supabase
            .from('addons')
            .delete()
            .eq('service_id', serviceId);
        }

        // Insérer les nouveaux add-ons
        const addOnsData = validAddOns.map(addon => ({
          service_id: serviceId,
          name: addon.name.trim(),
          description: addon.description || '',
          price: addon.price,
          duration: addon.duration,
          is_active: true
        }));

        console.log('🔍 [DEBUG] Données des add-ons à insérer:', addOnsData);

        const { error: addOnsError } = await supabase
          .from('addons')
          .insert(addOnsData);

        if (addOnsError) {
          console.error('🔍 [DEBUG] Erreur lors de la sauvegarde des add-ons:', addOnsError);
          // Ne pas faire échouer la sauvegarde du service pour les add-ons
        } else {
          console.log('🔍 [DEBUG] Add-ons sauvegardés avec succès!');
        }
      } else {
        console.log('🔍 [DEBUG] Aucun add-on valide à sauvegarder');
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

  // Gestion des images
  const handleImageUpload = async (file: File) => {
    if (!user || !shopId) return;

    setUploadingImages(true);
    try {
      const processedFile = await processImageFile(file);
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${shopId}/services/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(fileName, processedFile);

      if (error) {
        // Fallback vers le bucket avatars si service-images n'existe pas
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('avatars')
          .upload(fileName, processedFile);

        if (fallbackError) throw fallbackError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        setFormData({
          ...formData,
          image_urls: [...formData.image_urls, publicUrl]
        });
      } else {
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
          .getPublicUrl(fileName);

        setFormData({
          ...formData,
          image_urls: [...formData.image_urls, publicUrl]
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      image_urls: formData.image_urls.filter((_, i) => i !== index)
    });
  };

  // Gestion des formules
  const addFormula = () => {
    setFormData({
      ...formData,
      formulas: [...formData.formulas, { name: '', additionalPrice: 0, additionalDuration: 0, includedItems: [] }]
    });
  };

  const updateFormula = (index: number, field: string, value: string | number) => {
    const updatedFormulas = [...formData.formulas];
    updatedFormulas[index] = { ...updatedFormulas[index], [field]: value };
    setFormData({ ...formData, formulas: updatedFormulas });
  };

  const removeFormula = (index: number) => {
    setFormData({
      ...formData,
      formulas: formData.formulas.filter((_, i) => i !== index)
    });
  };

  // Gestion des points forts des formules
  const addIncludedItem = (formulaIndex: number) => {
    const updatedFormulas = [...formData.formulas];
    updatedFormulas[formulaIndex].includedItems.push('');
    setFormData({ ...formData, formulas: updatedFormulas });
  };

  const updateIncludedItem = (formulaIndex: number, itemIndex: number, value: string) => {
    const updatedFormulas = [...formData.formulas];
    updatedFormulas[formulaIndex].includedItems[itemIndex] = value;
    setFormData({ ...formData, formulas: updatedFormulas });
  };

  const removeIncludedItem = (formulaIndex: number, itemIndex: number) => {
    const updatedFormulas = [...formData.formulas];
    updatedFormulas[formulaIndex].includedItems.splice(itemIndex, 1);
    setFormData({ ...formData, formulas: updatedFormulas });
  };

  // Gestion des add-ons spécifiques
  const addSpecificAddOn = () => {
    console.log('🔍 [DEBUG] addSpecificAddOn appelée');
    setFormData({
      ...formData,
      specific_addons: [...formData.specific_addons, { name: '', price: 0, duration: 0, description: '' }]
    });
    console.log('🔍 [DEBUG] Nouveaux add-ons après ajout:', [...formData.specific_addons, { name: '', price: 0, duration: 0, description: '' }]);
  };

  const updateSpecificAddOn = (index: number, field: string, value: string | number) => {
    console.log('🔍 [DEBUG] updateSpecificAddOn appelée:', { index, field, value });
    const updatedAddOns = [...formData.specific_addons];
    updatedAddOns[index] = { ...updatedAddOns[index], [field]: value };
    setFormData({ ...formData, specific_addons: updatedAddOns });
    console.log('🔍 [DEBUG] Add-ons mis à jour:', updatedAddOns);
  };

  const removeSpecificAddOn = (index: number) => {
    setFormData({
      ...formData,
      specific_addons: formData.specific_addons.filter((_, i) => i !== index)
    });
  };

  // Gestion des variations par taille
  const updateVehicleSizeVariation = (sizeId: string, field: 'price' | 'duration', value: number) => {
    setFormData({
      ...formData,
      vehicle_size_variations: {
        ...formData.vehicle_size_variations,
        [sizeId]: {
          ...formData.vehicle_size_variations[sizeId],
          [field]: value
        }
      }
    });
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

              <div className="space-y-6">
                {/* Informations de base */}
      <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations de base</h5>

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
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900 border-b pb-2">Images du service</h5>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Service ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {formData.image_urls.length < 4 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`cursor-pointer text-center ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {uploadingImages ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          ) : (
                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          )}
                          <p className="text-sm text-gray-500">Ajouter image</p>
          </label>
                      </div>
                    )}
                  </div>
        </div>

                {/* Options avancées */}
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900 border-b pb-2">Options avancées</h5>

                  <div className="space-y-6">
        {/* Variations par taille de véhicule */}
                    {vehicleSizes.length > 0 && (
          <div>
                        <h6 className="text-md font-semibold text-gray-800 mb-3">Variations par taille de véhicule</h6>
            <div className="space-y-3">
                          {vehicleSizes.map((size) => (
                            <div key={size.id} className="bg-gray-50 rounded-lg p-4 border">
                              <h6 className="font-medium text-gray-900 mb-3 block">{size.name}</h6>
                              <div className="grid grid-cols-2 gap-4">
                  <div>
                                  <label className="block text-sm text-gray-600 mb-1">Supplément prix (€)</label>
                    <input
                      type="number"
                      step="0.01"
                                    value={formData.vehicle_size_variations[size.id]?.price || 0}
                                    onChange={(e) => updateVehicleSizeVariation(size.id, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                    />
                  </div>
                  <div>
                                  <label className="block text-sm text-gray-600 mb-1">Supplément durée (min)</label>
                    <input
                      type="number"
                                    value={formData.vehicle_size_variations[size.id]?.duration || 0}
                                    onChange={(e) => updateVehicleSizeVariation(size.id, 'duration', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                  />
                                </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

                    {/* Formules */}
        <div>
                      <div className="flex justify-between items-center mb-3">
                        <h6 className="text-md font-semibold text-gray-800">Formules</h6>
                        <button
                          type="button"
                          onClick={addFormula}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Ajouter une formule
                        </button>
                      </div>

                      <div className="space-y-4">
                        {formData.formulas.map((formula, formulaIndex) => (
                          <div key={formulaIndex} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex justify-between items-start mb-4">
                              <h6 className="font-medium text-gray-900">Formule {formulaIndex + 1}</h6>
                              <button
                                type="button"
                                onClick={() => removeFormula(formulaIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              {/* Nom de la formule */}
                <div>
                                <label className="block text-sm text-gray-600 mb-1">Nom de la formule</label>
                  <input
                    type="text"
                                  value={formula.name}
                                  onChange={(e) => updateFormula(formulaIndex, 'name', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Ex: Formule Premium"
                  />
                </div>

                              {/* Prix et durée additionnels */}
                              <div className="grid grid-cols-2 gap-4">
                <div>
                                  <label className="block text-sm text-gray-600 mb-1">Prix additionnel (€)</label>
                  <input
                    type="number"
                    step="0.01"
                                    value={formula.additionalPrice}
                                    onChange={(e) => updateFormula(formulaIndex, 'additionalPrice', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                  />
                </div>
                <div>
                                  <label className="block text-sm text-gray-600 mb-1">Durée additionnelle (min)</label>
                  <input
                    type="number"
                                    value={formula.additionalDuration}
                                    onChange={(e) => updateFormula(formulaIndex, 'additionalDuration', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                  />
                </div>
                              </div>

                              {/* Points forts inclus */}
                              <div>
                                <label className="block text-sm text-gray-600 mb-2">Points forts inclus</label>
                                <div className="space-y-2">
                                  {formula.includedItems.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-center gap-2">
                                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateIncludedItem(formulaIndex, itemIndex, e.target.value)}
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: Aspiration complète"
                                      />
                  <button
                    type="button"
                                        onClick={() => removeIncludedItem(formulaIndex, itemIndex)}
                                        className="text-red-500 hover:text-red-700 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
              </div>
            ))}
            <button
              type="button"
                                    onClick={() => addIncludedItem(formulaIndex)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    + Ajouter un point fort
            </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
          </div>
        </div>

                    {/* Add-ons spécifiques */}
        <div>
                      <div className="flex justify-between items-center mb-3">
                        <h6 className="text-md font-semibold text-gray-800">Add-ons spécifiques</h6>
                        <button
                          type="button"
                          onClick={addSpecificAddOn}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Ajouter un add-on
                        </button>
                      </div>

                      {formData.specific_addons.length > 0 ? (
                        <div className="space-y-3">
                          {formData.specific_addons.map((addOn, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex justify-between items-start mb-3">
                                <h6 className="font-medium text-gray-900">Add-on {index + 1}</h6>
                    <button
                      type="button"
                                  onClick={() => removeSpecificAddOn(index)}
                                  className="text-red-500 hover:text-red-700"
                    >
                                  <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm text-gray-600 mb-1">Nom de l'add-on</label>
                                    <input
                                      type="text"
                                      value={addOn.name}
                                      onChange={(e) => updateSpecificAddOn(index, 'name', e.target.value)}
                                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Ex: Cire haute qualité"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-600 mb-1">Description (optionnel)</label>
                                    <input
                                      type="text"
                                      value={addOn.description || ''}
                                      onChange={(e) => updateSpecificAddOn(index, 'description', e.target.value)}
                                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Description de l'add-on"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm text-gray-600 mb-1">Prix (€)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={addOn.price}
                                      onChange={(e) => updateSpecificAddOn(index, 'price', parseFloat(e.target.value) || 0)}
                                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-600 mb-1">Durée (min)</label>
                    <input
                                      type="number"
                                      value={addOn.duration}
                                      onChange={(e) => updateSpecificAddOn(index, 'duration', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Aucun add-on ajouté</p>
                      )}
                    </div>
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
