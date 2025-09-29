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

  // Initialiser category_id avec la première catégorie quand les catégories sont chargées
  useEffect(() => {
    if (categories.length > 0 && !formData.category_id && !editingService) {
      setFormData(prev => ({
        ...prev,
        category_id: categories[0].id
      }));
    }
  }, [categories]);

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

  const handleCreateService = (categoryId?: string) => {
    // Si on passe un categoryId, on l'utilise, sinon on prend la première catégorie
    const selectedCategoryId = categoryId || categories[0]?.id || '';
    console.log('🔍 handleCreateService - categoryId passé:', categoryId);
    console.log('🔍 handleCreateService - selectedCategoryId:', selectedCategoryId);
    setFormData({
      name: '',
      description: '',
      category_id: selectedCategoryId,
      base_price: 0,
      base_duration: 30,
      image_urls: [],
      vehicle_size_variations: {},
      formulas: [{ name: 'Basique', additionalPrice: 0, additionalDuration: 0, includedItems: [] }],
      specific_addons: []
    });
    setEditingService(null);
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
    console.log('🔍 handleSaveService - formData:', formData);
    console.log('🔍 handleSaveService - category_id:', formData.category_id);
    console.log('🔍 handleSaveService - validation:', {
      shopId: !!shopId,
      name: !!formData.name.trim(),
      category_id: !!formData.category_id
    });
    if (!shopId || !formData.name.trim() || !formData.category_id) {
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

        // First, delete existing add-ons for this service (always, like dashboard)
        console.log('🔍 [DEBUG] Suppression des anciens add-ons pour service:', serviceId);
        await supabase
          .from('addons')
          .delete()
          .eq('service_id', serviceId);

        // Insérer les nouveaux add-ons (exact same structure as dashboard)
        const addOnsData = validAddOns.map(addon => ({
          shop_id: shopId,
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
    setFormData(prev => ({
      ...prev,
      vehicle_size_variations: {
        ...prev.vehicle_size_variations,
        [sizeId]: {
          price: field === 'price' ? value : (prev.vehicle_size_variations[sizeId]?.price || 0),
          duration: field === 'duration' ? value : (prev.vehicle_size_variations[sizeId]?.duration || 0)
        }
      }
    }));
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border border-blue-100">
        <div className="mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Vos services</h3>
          </div>
        </div>

        {/* Services groupés par catégorie */}
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryServices = services.filter(s => s.category_id === category.id);
            return (
              <div key={category.id}>
                {/* En-tête de catégorie */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-300">
                  <div className="flex items-center gap-3">
                    {category.image_url && (
                      <img src={category.image_url} alt={category.name} className="w-10 h-10 object-cover rounded-lg" />
                    )}
                    <h4 className="text-xl font-bold text-gray-900">{category.name}</h4>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                      {categoryServices.length} {categoryServices.length > 1 ? 'services' : 'service'}
                    </span>
                  </div>
                </div>

                {/* Services ou message si catégorie vide */}
                {categoryServices.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 border-2 border-dashed border-gray-300 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium mb-4">Aucun service dans cette catégorie</p>
                    <button
                      onClick={() => handleCreateService(category.id)}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                      Ajouter un service →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryServices.map((service) => (
                      <div key={service.id} className="relative group">
                        <div className="flex flex-col overflow-hidden border border-gray-200 hover:border-blue-400 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                          {/* Image (conditionnelle) */}
                          {(service.image_urls && service.image_urls.length > 0) && (
                            <img src={service.image_urls[0]} alt={service.name} className="w-full h-40 object-cover rounded-t-lg" />
                          )}

                          {/* Contenu */}
                          <div className="p-6 flex flex-col flex-grow">
                            <div className="flex-grow">
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-neutral-dark pr-2">{service.name}</h3>
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 bg-green-100 text-green-800">
                                  Actif
                                </span>
                              </div>
                              <p className="text-gray-600 mt-2 text-sm min-h-[40px] line-clamp-2">{service.description}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xl font-bold text-neutral-dark">
                                Dès {service.base_price} €
                              </p>
                            </div>
                          </div>

                          {/* Boutons en overlay au hover */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditService(service);
                              }}
                              className="bg-white text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteService(service.id!);
                              }}
                              className="bg-white text-red-500 hover:text-red-700 p-1.5 rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de création/édition de service */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header de la modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between rounded-t-xl z-10">
              <h4 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Modifier le service' : 'Nouveau service'}
              </h4>
              <button
                onClick={() => setShowServiceForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu de la modal */}
            <div className="p-8">
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
                                    key={`price-${size.id}`}
                                    type="number"
                                    step="0.01"
                                    defaultValue={formData.vehicle_size_variations[size.id]?.price || 0}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      updateVehicleSizeVariation(size.id, 'price', val);
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">Supplément durée (min)</label>
                                  <input
                                    key={`duration-${size.id}`}
                                    type="number"
                                    defaultValue={formData.vehicle_size_variations[size.id]?.duration || 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      updateVehicleSizeVariation(size.id, 'duration', val);
                                    }}
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
                    disabled={saving || !formData.name.trim() || !formData.category_id}
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
          </div>
        </div>
      )}

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
