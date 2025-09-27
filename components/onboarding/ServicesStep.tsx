import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrashIcon } from '@heroicons/react/24/outline';
import { ImageIcon } from '../Icons';
import { processImageFile } from '../../lib/heicUtils';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { UnsavedChangesAlert } from '../common/UnsavedChangesAlert';

interface ServicesStepProps {
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
  image_urls?: string[];
  vehicle_size_variations?: { [key: string]: { price: number; duration: number } };
  specific_addons?: Array<{ name: string; price: number; duration: number; description?: string }>;
}

interface Category {
  id: string;
  name: string;
}

const ServicesStep: React.FC<ServicesStepProps> = ({
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
    key: 'onboarding-services',
    defaultData: []
  });

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicleSizes, setVehicleSizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({});
  const [showHeicInstructions, setShowHeicInstructions] = useState(false);

  useEffect(() => {
    console.log('🔄 ServicesStep: useEffect triggered');

    // Si on a des props, les utiliser directement
    if (propShopId && propCategories) {
      console.log('📦 ServicesStep: Using props data');
      setShopId(propShopId);
      setCategories(propCategories);
      setVehicleSizes(propVehicleSizes || []);
      setInitialLoading(false);

      // Utiliser les services persistés ou les props
      if (persistedServices.length > 0) {
        console.log('📦 ServicesStep: Loading persisted services:', persistedServices.length);
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
        console.log('📦 ServicesStep: Loading prop services:', propServices.length);
        setServices(propServices);
      } else {
        // Ne pas pré-remplir de services - laisser l'utilisateur créer le premier service
        setServices([]);
      }
    } else {
      // Fallback: fetch si pas de props
      console.log('🔄 ServicesStep: No props, fetching data...');
      fetchShopAndCategories();
    }
  }, [propShopId, propCategories, propServices, persistedServices]);


  const fetchShopAndCategories = async () => {
    if (!user) return;

    try {
      console.log('🔄 ServicesStep: fetchShopAndCategories started');
      setInitialLoading(true);
      // Récupérer le shop
      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('email', user.email)
        .single();

      if (shopData) {
        setShopId(shopData.id);

        // Récupérer les catégories
        const { data: categoriesData } = await supabase
          .from('shop_service_categories')
          .select('*')
          .eq('shop_id', shopData.id);

        setCategories(categoriesData || []);

        // Récupérer les services existants
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('shop_id', shopData.id);

        if (servicesData && servicesData.length > 0) {
          const mappedServices = servicesData.map(service => ({
            id: service.id,
            name: service.name || '',
            description: service.description || '',
            category_id: service.category_id || categoriesData?.[0]?.id || '',
            base_price: service.base_price || 0,
            base_duration: service.base_duration || 30,
            image_urls: service.image_urls || []
          }));
          setServices(mappedServices);
        } else {
          // Ne pas créer de services par défaut - laisser l'utilisateur créer le premier service
          setServices([]);
        }
      }
    } catch (error) {
      console.error('❌ ServicesStep: Erreur lors du chargement:', error);
    } finally {
      console.log('✅ ServicesStep: fetchShopAndCategories completed');
      setInitialLoading(false);
    }
  };

  const addService = () => {
    if (categories.length === 0) return;

    const newService = {
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      base_price: 0,
      base_duration: 30,
      image_urls: [],
      vehicle_size_variations: {},
      specific_addons: []
    };
    const updatedServices = [...services, newService];
    setServices(updatedServices);
    setPersistedServices(updatedServices);
  };

  const removeService = (index: number) => {
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
    setPersistedServices(updatedServices);
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const updatedServices = [...services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setServices(updatedServices);
    setPersistedServices(updatedServices);
  };

  const updateServiceVehicleSizeVariation = (serviceIndex: number, vehicleSizeId: string, field: 'price' | 'duration', value: number) => {
    const updatedServices = [...services];
    if (!updatedServices[serviceIndex].vehicle_size_variations) {
      updatedServices[serviceIndex].vehicle_size_variations = {};
    }
    if (!updatedServices[serviceIndex].vehicle_size_variations![vehicleSizeId]) {
      updatedServices[serviceIndex].vehicle_size_variations![vehicleSizeId] = { price: 0, duration: 0 };
    }
    updatedServices[serviceIndex].vehicle_size_variations![vehicleSizeId][field] = value;
    setServices(updatedServices);
    setPersistedServices(updatedServices);
  };

  const updateServiceAddOn = (serviceIndex: number, addOnIndex: number, field: string, value: any) => {
    const updatedServices = [...services];
    if (!updatedServices[serviceIndex].specific_addons) {
      updatedServices[serviceIndex].specific_addons = [];
    }
    if (!updatedServices[serviceIndex].specific_addons![addOnIndex]) {
      updatedServices[serviceIndex].specific_addons![addOnIndex] = { name: '', price: 0, duration: 0 };
    }
    updatedServices[serviceIndex].specific_addons![addOnIndex] = {
      ...updatedServices[serviceIndex].specific_addons![addOnIndex],
      [field]: value
    };
    setServices(updatedServices);
    setPersistedServices(updatedServices);
  };

  const addAddOnToService = (serviceIndex: number) => {
    const updatedServices = [...services];
    if (!updatedServices[serviceIndex].specific_addons) {
      updatedServices[serviceIndex].specific_addons = [];
    }
    updatedServices[serviceIndex].specific_addons!.push({ name: '', price: 0, duration: 0 });
    setServices(updatedServices);
    setPersistedServices(updatedServices);
  };

  const removeAddOnFromService = (serviceIndex: number, addOnIndex: number) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].specific_addons) {
      updatedServices[serviceIndex].specific_addons!.splice(addOnIndex, 1);
      setServices(updatedServices);
      setPersistedServices(updatedServices);
    }
  };

  const addImageToService = (index: number, imageUrl: string) => {
    const updatedServices = [...services];
    if (!updatedServices[index].image_urls) {
      updatedServices[index].image_urls = [];
    }
    if (updatedServices[index].image_urls!.length < 4) {
      updatedServices[index].image_urls!.push(imageUrl);
    }
    setServices(updatedServices);
    setPersistedServices(updatedServices);
  };

  const removeImageFromService = (index: number, imageIndex: number) => {
    const updatedServices = [...services];
    if (updatedServices[index].image_urls) {
      updatedServices[index].image_urls!.splice(imageIndex, 1);
    }
    setServices(updatedServices);
    setPersistedServices(updatedServices);
  };



  const handleImageUpload = async (index: number, file: File) => {
    if (!shopId) return;

    console.log(`📤 Starting image upload for service ${index}: ${file.name}, type: ${file.type}`);
    setUploadingImages(prev => ({ ...prev, [index]: true }));

    try {
      // Process the image file (validation + HEIC conversion)
      const processedFile = await processImageFile(file);
      console.log(`✅ File processed, ready for upload: ${processedFile.name}, type: ${processedFile.type}`);

      // Validation supplémentaire : vérifier que le fichier n'est pas vide
      if (processedFile.size === 0) {
        throw new Error('Le fichier image est vide ou corrompu');
      }

      // Validation supplémentaire : vérifier que c'est bien une image
      if (!processedFile.type.startsWith('image/')) {
        throw new Error('Le fichier n\'est pas une image valide');
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${shopId}/services/${Date.now()}-${index}.${fileExt}`;

      console.log(`📁 Uploading to: ${fileName}`);

      // Essayer d'abord avec le bucket 'service-images', sinon utiliser 'avatars'
      let bucketName = 'service-images';
      let { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, processedFile);

      console.log(`📤 Upload attempt 1 (${bucketName}):`, { data, error });

      // Si le bucket n'existe pas, essayer avec 'avatars'
      if (error && error.message.includes('not found')) {
        bucketName = 'avatars';
        const result = await supabase.storage
          .from(bucketName)
          .upload(fileName, processedFile);
        data = result.data;
        error = result.error;
        console.log(`📤 Upload attempt 2 (${bucketName}):`, { data, error });
      }

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log(`✅ Upload successful: ${publicUrl}`);
      addImageToService(index, publicUrl);
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      alert(error.message || t.uploadError);
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const saveServices = async () => {
    if (!shopId || services.length === 0) return;

    // Vérifier que les catégories sont chargées
    if (categories.length === 0) {
      alert('Les catégories ne sont pas encore chargées. Veuillez patienter...');
      return;
    }

    setLoading(true);
    try {
      // Vérifier que tous les services ont un nom et une catégorie valide
      const validCategoryIds = categories.map(c => c.id);
      const invalidServices = services.filter(s =>
        !s.name.trim() ||
        !s.category_id ||
        s.category_id.trim() === '' ||
        !validCategoryIds.includes(s.category_id)
      );
      if (invalidServices.length > 0) {
        alert('Veuillez donner un nom et sélectionner une catégorie valide pour tous les services');
        return;
      }

      // Supprimer les services existants pour cette étape d'onboarding
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('shop_id', shopId);

      if (deleteError) {
        console.error('Erreur lors de la suppression:', deleteError);
        // Continue même si la suppression échoue
      }

      // Créer les nouveaux services
      const servicesToInsert = services.map(service => ({
        shop_id: shopId,
        category_id: service.category_id,
        name: service.name.trim(),
        description: service.description.trim(),
        base_price: Number(service.base_price) || 0,
        base_duration: Number(service.base_duration) || 30,
        image_urls: service.image_urls || [],
        is_active: true
      }));

      const { data: insertedServices, error } = await supabase
        .from('services')
        .insert(servicesToInsert)
        .select();

      if (error) {
        console.error('Erreur lors de l\'insertion:', error);
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }

      console.log('Services sauvegardés avec succès:', insertedServices);

      // Clear persisted data after successful save
      setPersistedServices([]);

      // Notifier le parent des nouvelles données
      if (onDataUpdate) {
        onDataUpdate(insertedServices || services);
      }

      onNext();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(error.message || 'Erreur lors de la sauvegarde des services');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = services.length > 0 && services.every(service =>
    service.name.trim() && service.category_id && service.base_price > 0
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Unsaved changes alert */}
      <UnsavedChangesAlert hasUnsavedChanges={hasUnsavedChanges()} />
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Créer votre premier service
        </h2>
        <p className="text-gray-600">
          Définissez votre premier service. Vous pourrez en ajouter d'autres plus tard.
        </p>
      </div>

      {initialLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Vous devez d'abord créer des catégories de services dans l'étape précédente.
          </p>
        </div>
      ) : (
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
          <p className="text-gray-600 mb-6">Définissez les services que vous proposez à vos clients</p>

          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Service {index + 1}
                  </h4>
                  {services.length > 1 && (
                    <button
                      onClick={() => removeService(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

              <div className="space-y-4">
                {/* Nom du service en premier */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Nettoyage intérieur complet"
                  />
                </div>

                {/* Catégorie, Prix, Durée dans la même row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Catégorie *
                    </label>
                    <select
                      value={service.category_id}
                      onChange={(e) => updateService(index, 'category_id', e.target.value)}
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
                      value={service.base_price}
                      onChange={(e) => updateService(index, 'base_price', parseFloat(e.target.value) || 0)}
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
                      min="5"
                      step="5"
                      value={service.base_duration}
                      onChange={(e) => updateService(index, 'base_duration', parseInt(e.target.value) || 30)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* Description en pleine largeur */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={service.description}
                    onChange={(e) => updateService(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez ce service en détail..."
                  />
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t.servicePhoto} {service.image_urls && service.image_urls.length > 0 && `(${service.image_urls.length}/4)`}
                  </label>

                  {/* Affichage des images existantes avec carré + */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* Carré + pour ajouter une image */}
                    {(!service.image_urls || service.image_urls.length < 4) && !uploadingImages[index] && (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => document.getElementById(`image-upload-${index}`)?.click()}>
                      </div>
                    )}

                    {/* Loader pendant l'upload/conversion */}
                    {uploadingImages[index] && (
                      <div className="w-20 h-20 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-1"></div>
                        <span className="text-xs text-blue-600 font-medium">Conversion...</span>
                      </div>
                    )}

                    {/* Images existantes */}
                    {service.image_urls && service.image_urls.map((imageUrl, imageIndex) => (
                      <div key={imageIndex} className="relative">
                        <img
                          src={imageUrl}
                          alt={`${service.name} - Image ${imageIndex + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageFromService(index, imageIndex)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Input file caché */}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(index, file);
                    }}
                    className="hidden"
                    id={`image-upload-${index}`}
                    disabled={uploadingImages[index]}
                  />

                  {/* Message d'information */}
                  <p className="text-xs text-gray-500">
                    Tous formats d'images jusqu'à 10MB (JPEG, PNG, WebP) • Max 4 photos
                    <br />
                    <span className="text-xs text-gray-500">
                      Pour les photos iPhone :
                      <button
                        onClick={() => setShowHeicInstructions(true)}
                        className="text-blue-600 hover:text-blue-800 underline ml-1"
                      >
                        convertir vos photos en JPEG (i)
                      </button>
                    </span>
                  </p>

                  {/* Message si limite atteinte */}
                  {service.image_urls && service.image_urls.length >= 4 && (
                    <p className="text-xs text-green-600 font-medium">
                      ✅ Maximum de 4 photos atteint
                    </p>
                  )}
                </div>

                {/* Variations par taille de véhicule */}
                {vehicleSizes.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Variations par taille de véhicule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehicleSizes.map(vehicleSize => {
                        const variation = service.vehicle_size_variations?.[vehicleSize.id] || { price: 0, duration: 0 };
                        return (
                          <div key={vehicleSize.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <h5 className="font-medium text-gray-700 mb-3">
                              {vehicleSize.name}
                              {vehicleSize.subtitle && <span className="text-sm text-gray-500 block">{vehicleSize.subtitle}</span>}
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Prix additionnel (€)</label>
                                <input
                                  type="number"
                                  value={variation.price}
                                  onChange={(e) => updateServiceVehicleSizeVariation(index, vehicleSize.id, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-full p-2 border border-gray-200 rounded text-sm"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Durée additionnelle (min)</label>
                                <input
                                  type="number"
                                  value={variation.duration}
                                  onChange={(e) => updateServiceVehicleSizeVariation(index, vehicleSize.id, 'duration', parseInt(e.target.value) || 0)}
                                  className="w-full p-2 border border-gray-200 rounded text-sm"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add-ons spécifiques */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-semibold text-gray-800">Add-ons spécifiques</h4>
                    <button
                      type="button"
                      onClick={() => addAddOnToService(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      Ajouter un add-on
                    </button>
                  </div>

                  {service.specific_addons && service.specific_addons.length > 0 ? (
                    <div className="space-y-3">
                      {service.specific_addons.map((addOn, addOnIndex) => (
                        <div key={addOnIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Nom de l'add-on</label>
                              <input
                                type="text"
                                value={addOn.name}
                                onChange={(e) => updateServiceAddOn(index, addOnIndex, 'name', e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded text-sm"
                                placeholder="Ex: Cire haute qualité"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Description (optionnel)</label>
                              <input
                                type="text"
                                value={addOn.description || ''}
                                onChange={(e) => updateServiceAddOn(index, addOnIndex, 'description', e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded text-sm"
                                placeholder="Description de l'add-on"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Prix (€)</label>
                              <input
                                type="number"
                                value={addOn.price}
                                onChange={(e) => updateServiceAddOn(index, addOnIndex, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border border-gray-200 rounded text-sm"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Durée (min)</label>
                              <input
                                type="number"
                                value={addOn.duration}
                                onChange={(e) => updateServiceAddOn(index, addOnIndex, 'duration', parseInt(e.target.value) || 0)}
                                className="w-full p-2 border border-gray-200 rounded text-sm"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end mt-2">
                            <button
                              type="button"
                              onClick={() => removeAddOnFromService(index, addOnIndex)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Aucun add-on spécifique pour ce service</p>
                  )}
                </div>
              </div>
            </div>
          ))}

            {/* Bouton d'ajout à l'intérieur de la liste */}
            <button
              onClick={addService}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {services.length === 0 ? 'Créer votre premier service' : 'Ajouter un service'}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Retour
        </button>

        <div className="text-sm text-gray-500">
          {services.length} service{services.length !== 1 ? 's' : ''} configuré{services.length !== 1 ? 's' : ''}
        </div>

        <button
          onClick={saveServices}
          disabled={!canProceed || loading}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${canProceed && !loading
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {loading ? 'Sauvegarde...' : 'Terminer l\'onboarding'}
        </button>
      </div>

      {/* Instructions HEIC Modal */}
      {showHeicInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📱 Convertir ses images en JPEG</h3>
              <button
                onClick={() => setShowHeicInstructions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3">💡 Instructions pour iPhone :</h4>
                <ol className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                    <span>Ouvrez l'app <strong>Photos</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                    <span>Sélectionnez votre photo HEIC</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                    <span>Appuyez sur <strong>Partager</strong> (icône carrée avec flèche)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                    <span>Choisissez <strong>Enregistrer dans Fichiers</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
                    <span>Sélectionnez <strong>JPEG</strong> comme format</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">6</span>
                    <span>Revenez ici et uploadez le fichier JPEG</span>
                  </li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  <strong>✅ Astuce :</strong> Une fois converti, le fichier JPEG sera dans l'app Fichiers et vous pourrez l'uploader directement ici !
                </p>
              </div>

              <button
                onClick={() => setShowHeicInstructions(false)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServicesStep;
