import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, PlusIcon, TrashIcon, SaveIcon, CheckCircleIcon, Bars3Icon } from '../Icons';
import { Service, Formula, VehicleSizeSupplement, AddOn, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';
import { supabase } from '../../lib/supabaseClient';
import AlertModal from '../AlertModal';
import FormRestoreAlert from '../FormRestoreAlert';
import { toSnakeCase, toCamelCase } from '../../lib/utils';
import { IS_MOCK_MODE } from '../../lib/env';
import DurationPicker from '../common/DurationPicker';
import { useFormPersistence } from '../../hooks/useFormPersistence';

type FormulaWithIncluded = Omit<Partial<Formula>, 'description'> & { includedItems?: string[]; features?: string[] };

interface ServiceEditorProps {
  serviceId: string | 'new';
  shopId: string;
  supportedVehicleSizes: string[]; // Deprecated - keeping for compatibility
  vehicleSizes: ShopVehicleSize[];
  serviceCategories: ShopServiceCategory[];
  onBack: () => void;
  onSave: (updatedService?: Service) => void;
  onDelete: () => void;
  initialData?: (Service & { formulas: Formula[], supplements: VehicleSizeSupplement[], specificAddOns: AddOn[] }) | null;
}


const ServiceEditor: React.FC<ServiceEditorProps> = ({
  serviceId,
  shopId,
  supportedVehicleSizes,
  vehicleSizes,
  serviceCategories,
  onBack,
  onSave,
  onDelete,
  initialData
}) => {
  const { t } = useLanguage();
  const isEditing = serviceId !== 'new';

  // Persistance automatique du formulaire
  const {
    data: persistedData,
    setData: setPersistedData,
    clearData: clearPersistedData,
    hasUnsavedChanges
  } = useFormPersistence<Partial<Service>>({
    key: `service_${serviceId}`,
    defaultData: {}
  });

  const [formData, setFormData] = useState<Partial<Service>>(persistedData);
  const hasPersistedData = Object.keys(persistedData).length > 0;

  // Synchronisation gérée dans initializeState pour éviter les re-renders multiples

  const [formulas, setFormulas] = useState<FormulaWithIncluded[]>([]);
  const [supplements, setSupplements] = useState<Partial<VehicleSizeSupplement>[]>([]);
  const [specificAddOns, setSpecificAddOns] = useState<Partial<AddOn>[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  const [showRestoreAlert, setShowRestoreAlert] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const initializeState = async () => {
      // Éviter les initialisations multiples
      if (isInitialized) return;

      setLoading(true);

      // Vérifier s'il y a des données persistées pour un nouveau service
      if (serviceId === 'new' && hasPersistedData) {
        setShowRestoreAlert(true);
      }

      const setupNewService = () => {
        // Ne pas écraser si on a des données persistées
        if (!hasPersistedData) {
          // Utiliser la catégorie de l'URL si disponible, sinon la première catégorie
          const urlParams = new URLSearchParams(window.location.search);
          const categoryFromUrl = urlParams.get('category');
          const defaultCategoryId = categoryFromUrl || serviceCategories[0]?.id || '';

          setFormData({
            name: '',
            description: '',
            is_active: true,
            category_id: defaultCategoryId,
            base_price: 50,
            base_duration: 60
          });
        }
        setFormulas([{ name: 'Basique', includedItems: [], additionalPrice: 0, additionalDuration: 0 }]);
        setSupplements([]);
        setSpecificAddOns([]);
        setLoading(false);
        setIsInitialized(true);
      };

      if (serviceId === 'new') {
        // Attendre que les catégories soient chargées
        if (serviceCategories.length === 0) {
          setLoading(false);
          setIsInitialized(true);
          return;
        }
        setupNewService();
        return;
      }

      if (IS_MOCK_MODE) {
        if (initialData) {
          const { formulas: initialFormulas, supplements: initialSupplements, specificAddOns: initialAddOns, ...serviceData } = initialData;
          setFormData(serviceData);
          setImagePreviewUrl(serviceData.image_urls?.[0] || null);
          setFormulas(initialFormulas.map(f => ({
            ...f,
            includedItems: f.features || (f.description ? f.description.split('\n').filter(Boolean) : [])
          })));
          setSupplements(initialSupplements);
          setSpecificAddOns(initialAddOns);
        }
        setLoading(false);
        setIsInitialized(true);
      } else {
        // Real mode fetch for editing
        try {
          const { data: service, error: serviceError } = await supabase.from('services').select('*').eq('id', serviceId).single();
          if (serviceError) throw serviceError;

          // Convert snake_case to camelCase for form data
          const serviceData = {
            id: service.id,
            shop_id: service.shop_id,
            category_id: service.category_id,
            name: service.name,
            description: service.description,
            base_price: service.base_price,
            base_duration: service.base_duration,
            is_active: service.is_active,
            image_urls: service.image_urls || []
          };

          setFormData(serviceData);
          setPersistedData(serviceData); // Synchroniser avec persistedData
          setImagePreviewUrl(service.image_urls?.[0] || null);

          // Load existing add-ons for this service (simplified structure)
          const { data: addOns, error: addOnsError } = await supabase
            .from('addons')
            .select('id, name, description, price, duration')
            .eq('service_id', serviceId)
            .eq('is_active', true);

          if (addOnsError) {
            console.error('Error loading add-ons:', addOnsError);
          } else {
            const loadedAddOns = addOns?.map((addon: any) => ({
              id: addon.id,
              name: addon.name,
              description: addon.description || '',
              price: parseFloat(addon.price) || 0,
              duration: addon.duration || 0
            })) || [];
            setSpecificAddOns(loadedAddOns);
          }

          // Charger les variations par taille de véhicule
          if (service.vehicle_size_variations) {
            const loadedSupplements = vehicleSizes.map(vs => {
              const variation = service.vehicle_size_variations[vs.id];
              return {
                vehicleSizeId: vs.id,
                additionalPrice: variation?.price || 0,
                additionalDuration: variation?.duration || 0
              };
            });
            setSupplements(loadedSupplements);
          } else {
            setSupplements([]);
          }

          // Charger les formules
          if (service.formulas && Array.isArray(service.formulas)) {
            setFormulas(service.formulas.map(f => ({
              ...f,
              includedItems: f.features || f.includedItems || []
            })));
          } else {
            setFormulas([{ name: 'Basique', includedItems: [], additionalPrice: 0, additionalDuration: 0 }]);
          }
        } catch (error: any) {
          console.error("Error fetching service data:", error);
          setAlertInfo({ isOpen: true, title: "Fetch Error", message: `Failed to load service data: ${error.message}` });
          onBack();
        } finally {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeState();
  }, [serviceId, initialData, onBack, serviceCategories, isInitialized]);

  const handleInputChange = (field: keyof Service, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setPersistedData(newData);
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      if (formData.image_urls?.includes(imagePreviewUrl)) {
        setImageToDelete(imagePreviewUrl);
      }
      setImagePreviewUrl(null);
    }
    setImageFile(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveClick = async () => {
    console.log('🔍 [DEBUG] Starting save process...');
    console.log('🔍 [DEBUG] Form data:', formData);
    console.log('🔍 [DEBUG] Service ID:', serviceId);
    console.log('🔍 [DEBUG] Is editing:', isEditing);
    console.log('🔍 [DEBUG] IS_MOCK_MODE:', IS_MOCK_MODE);
    console.log('🔍 [DEBUG] Shop ID:', shopId);

    if (IS_MOCK_MODE) {
      console.log('%c[MOCK MODE]%c Simulating save for service.', 'color: purple; font-weight: bold;', 'color: inherit;');
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setAlertInfo({ isOpen: true, title: 'Démo', message: 'La sauvegarde est simulée en mode démo.' });
        // Nettoyer les données persistées après sauvegarde réussie
        clearPersistedData();
        onSave(); // Mode mock - pas de service à passer
      }, 1000);
      return;
    }

    if (!shopId) {
      setAlertInfo({ isOpen: true, title: "Error", message: "Shop ID is missing. Cannot save." });
      return;
    }

    // Validation des champs requis
    if (!formData.name?.trim()) {
      setAlertInfo({ isOpen: true, title: "Error", message: "Le nom du service est requis." });
      return;
    }

    if (!formData.category_id) {
      setAlertInfo({ isOpen: true, title: "Error", message: "La catégorie est requise." });
      return;
    }

    if (!formData.base_price || formData.base_price <= 0) {
      setAlertInfo({ isOpen: true, title: "Error", message: "Le prix de base doit être supérieur à 0." });
      return;
    }

    if (!formData.base_duration || formData.base_duration <= 0) {
      setAlertInfo({ isOpen: true, title: "Error", message: "La durée de base doit être supérieure à 0." });
      return;
    }
    setIsSaving(true);
    let finalImageUrls = formData.image_urls || [];

    try {
      console.log('🔍 [DEBUG] Starting image processing...');

      if (imageToDelete) {
        console.log('🔍 [DEBUG] Deleting image:', imageToDelete);
        const oldImagePath = imageToDelete.split('/service-images/')[1];
        if (oldImagePath) {
          await supabase.storage.from('service-images').remove([oldImagePath]);
        }
        // Remove the deleted image from the array
        finalImageUrls = finalImageUrls.filter(url => url !== imageToDelete);
      }

      if (imageFile) {
        console.log('🔍 [DEBUG] Uploading new image:', imageFile.name);
        // Remove old image if replacing
        if (finalImageUrls.length > 0) {
          const oldImagePath = finalImageUrls[0].split('/service-images/')[1];
          if (oldImagePath) await supabase.storage.from('service-images').remove([oldImagePath]);
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${shopId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('service-images').upload(filePath, imageFile);
        if (uploadError) {
          console.error('🔍 [DEBUG] Upload error:', uploadError);
          throw uploadError;
        }
        const { data } = supabase.storage.from('service-images').getPublicUrl(filePath);
        // Replace the first image or add new one
        finalImageUrls = [data.publicUrl];
        console.log('🔍 [DEBUG] Image uploaded successfully:', data.publicUrl);
      }

      console.log('🔍 [DEBUG] Image processing completed');

      // Construire les variations par taille de véhicule
      console.log('🔍 [DEBUG] Supplements before saving:', supplements);
      const vehicleSizeVariations: { [key: string]: { price: number; duration: number } } = {};
      supplements.forEach(supplement => {
        if (supplement.additionalPrice !== undefined && supplement.additionalDuration !== undefined) {
          vehicleSizeVariations[supplement.vehicleSizeId] = {
            price: supplement.additionalPrice || 0,
            duration: supplement.additionalDuration || 0
          };
        }
      });
      console.log('🔍 [DEBUG] Vehicle size variations:', vehicleSizeVariations);

      const servicePayload: any = {
        shop_id: shopId,
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        base_price: formData.base_price,
        base_duration: formData.base_duration,
        is_active: formData.is_active,
        image_urls: finalImageUrls,
        vehicle_size_variations: vehicleSizeVariations,
        formulas: formulas
      };
      if (isEditing) {
        servicePayload.id = serviceId;
      }

      console.log('🔍 [DEBUG] Service payload:', servicePayload);
      console.log('🔍 [DEBUG] Formulas being saved:', formulas);
      console.log('🔍 [DEBUG] Final image URLs:', finalImageUrls);

      console.log('🔍 [DEBUG] Starting service upsert...');
      const { data: savedService, error: serviceError } = await supabase
        .from('services')
        .upsert(servicePayload)
        .select()
        .single();

      console.log('🔍 [DEBUG] Supabase response:', { savedService, serviceError });

      if (serviceError) {
        console.error('🔍 [DEBUG] Service error details:', serviceError);
        throw serviceError;
      }

      const currentServiceId = savedService.id;
      console.log('🔍 [DEBUG] Saved service ID:', currentServiceId);

      // Save add-ons (simplified structure)
      console.log('🔍 [DEBUG] Saving add-ons:', specificAddOns);

      // First, delete existing add-ons for this service
      console.log('🔍 [DEBUG] Deleting existing add-ons...');
      await supabase
        .from('addons')
        .delete()
        .eq('service_id', currentServiceId);
      console.log('🔍 [DEBUG] Existing add-ons deleted');

      // Create new add-ons for this service
      if (specificAddOns.length > 0) {
        const addOnsToInsert = specificAddOns
          .filter(addOn => addOn.name && addOn.name.trim())
          .map(addOn => ({
            shop_id: shopId,
            service_id: currentServiceId,
            name: addOn.name,
            description: addOn.description || '',
            price: addOn.price || 0,
            duration: addOn.duration || 0,
            is_active: true
          }));

        if (addOnsToInsert.length > 0) {
          console.log('🔍 [DEBUG] Inserting new add-ons...');
          const { error: addOnsError } = await supabase
            .from('addons')
            .insert(addOnsToInsert);

          if (addOnsError) {
            console.error('🔍 [DEBUG] Add-ons creation error:', addOnsError);
            throw addOnsError;
          }
          console.log('🔍 [DEBUG] Add-ons inserted successfully');
        }
      }

      console.log('🔍 [DEBUG] Save completed successfully');
      // Nettoyer les données persistées après sauvegarde réussie
      clearPersistedData();
      
      // Arrêter le loading et naviguer avec le service mis à jour
      setIsSaving(false);
      onSave(savedService);

    } catch (error: any) {
      console.error("Save error:", error);
      setAlertInfo({ isOpen: true, title: "Save Error", message: `Error during save: ${error.message}` });
      setIsSaving(false); // Arrêter le loading en cas d'erreur
    } finally {
      console.log('🔍 [DEBUG] Finally block executed');
    }
  };

  const handleDeleteClick = async () => {
    if (IS_MOCK_MODE) {
      if (window.confirm(t.deleteServiceConfirmation)) {
        console.log('%c[MOCK MODE]%c Simulating delete for service.', 'color: purple; font-weight: bold;', 'color: inherit;');
        setAlertInfo({ isOpen: true, title: 'Démo', message: 'La suppression est simulée en mode démo.' });
        onDelete();
      }
      return;
    }
    if (isEditing && window.confirm(t.deleteServiceConfirmation)) {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);
      if (error) {
        console.error("Error deleting service:", error);
        setAlertInfo({ isOpen: true, title: "Delete Error", message: `Error deleting service: ${error.message}` });
        return;
      }
      onDelete();
    }
  }

  // Helper function to get included items from formula
  const getIncludedItems = (formula: FormulaWithIncluded): string[] => {
    return formula.includedItems || formula.features || [];
  };

  const addFormula = () => setFormulas(prev => [...prev, { name: '', includedItems: [], additionalPrice: 0, additionalDuration: 0 }]);
  const updateFormulaField = (index: number, field: keyof FormulaWithIncluded, value: any) => {
    const newFormulas = [...formulas];
    let val = value;
    if (field === 'additionalPrice' || field === 'additionalDuration') {
      val = value === '' || value === null ? 0 : Number(value) || 0;
    }
    (newFormulas[index] as any)[field] = val;
    setFormulas(newFormulas);
  };
  const removeFormula = (index: number) => setFormulas(formulas.filter((_, i) => i !== index));

  const addIncludedItem = (formulaIndex: number) => {
    const newFormulas = [...formulas];
    if (!newFormulas[formulaIndex].includedItems) {
      newFormulas[formulaIndex].includedItems = [];
    }
    newFormulas[formulaIndex].includedItems!.push('');
    setFormulas(newFormulas);
  }
  const updateIncludedItem = (formulaIndex: number, itemIndex: number, value: string) => {
    const newFormulas = [...formulas];
    if (!newFormulas[formulaIndex].includedItems) {
      newFormulas[formulaIndex].includedItems = [];
    }
    newFormulas[formulaIndex].includedItems![itemIndex] = value;
    setFormulas(newFormulas);
  }
  const removeIncludedItem = (formulaIndex: number, itemIndex: number) => {
    const newFormulas = [...formulas];
    if (!newFormulas[formulaIndex].includedItems) {
      newFormulas[formulaIndex].includedItems = [];
    }
    newFormulas[formulaIndex].includedItems!.splice(itemIndex, 1);
    setFormulas(newFormulas);
  }

  const handleDragSort = (formulaIndex: number) => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const newFormulas = [...formulas];
    const formulaToUpdate = newFormulas[formulaIndex];
    if (!formulaToUpdate.includedItems) {
      formulaToUpdate.includedItems = [];
    }
    const newIncludedItems = [...formulaToUpdate.includedItems];

    const dragItemContent = newIncludedItems.splice(dragItem.current, 1)[0];
    newIncludedItems.splice(dragOverItem.current, 0, dragItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    formulaToUpdate.includedItems = newIncludedItems;
    setFormulas(newFormulas);
  };

  const addSpecificAddOn = () => setSpecificAddOns(prev => [...prev, { name: '', price: 0, duration: 0 }]);
  const updateSpecificAddOn = (index: number, field: keyof AddOn, value: any) => {
    const newAddons = [...specificAddOns];
    let val = value;
    if (field === 'price' || field === 'duration') {
      val = value === '' || value === null ? 0 : Number(value) || 0;
    }
    (newAddons[index] as any)[field] = val;
    setSpecificAddOns(newAddons);
  };
  const removeSpecificAddOn = (index: number) => setSpecificAddOns(specificAddOns.filter((_, i) => i !== index));

  const updateSupplement = (vehicleSizeId: string, field: 'additionalPrice' | 'additionalDuration', value: string) => {
    const numValue = value === '' || value === null ? 0 : Number(value) || 0;
    setSupplements(prev => {
      const existingIndex = prev.findIndex(s => s.vehicleSizeId === vehicleSizeId);
      if (existingIndex > -1) {
        const newSupplements = [...prev];
        (newSupplements[existingIndex] as any)[field] = numValue;
        return newSupplements;
      } else {
        const newSupplement: Partial<VehicleSizeSupplement> = {
          vehicleSizeId,
          additionalPrice: 0,
          additionalDuration: 0,
          serviceId: serviceId === 'new' ? '' : serviceId
        };
        (newSupplement as any)[field] = numValue;
        return [...prev, newSupplement];
      }
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <FormRestoreAlert
        isVisible={showRestoreAlert}
        onRestore={() => {
          setShowRestoreAlert(false);
          // Les données sont déjà dans formData grâce au hook
        }}
        onDismiss={() => {
          setShowRestoreAlert(false);
          clearPersistedData();
          // Réinitialiser avec les valeurs par défaut
          setFormData({ name: '', description: '', status: 'active', category: 'interior', basePrice: 50, baseDuration: 60 });
        }}
      />
      <div className="flex justify-between items-center mb-6">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Retour au catalogue</span>
        </button>
        <h2 className="text-2xl font-bold text-brand-dark">{isEditing ? t.editService : t.addNewService}</h2>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md space-y-8">
        <section>
          {/* Mobile: Image first */}
          <div className="md:hidden mb-6">
            <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
              {imagePreviewUrl ? <img src={imagePreviewUrl} alt="Service Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-gray-400" />}
            </div>
            <input type="file" id="serviceImageUploadMobile" className="hidden" onChange={handleImageChange} accept="image/*" />
            <div className="mt-2 flex gap-2">
              <label htmlFor="serviceImageUploadMobile" className="flex-1 block text-center bg-gray-200 text-neutral-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">{t.changeImage}</label>
              {imagePreviewUrl && <button onClick={handleRemoveImage} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title={t.removeImage}><TrashIcon /></button>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Category and Status Row - FIRST */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="" disabled>Choisir une catégorie</option>
                    {serviceCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${formData.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                      {formData.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('is_active', !formData.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.is_active ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Service Name */}
              <div>
                <label className="form-label">
                  Nom du service *
                </label>
                <input
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t.serviceNamePlaceholder}
                  className="form-input text-lg font-bold"
                  required
                />
              </div>

              {/* Price and Duration Row */}
              <div className="flex gap-4">
                <div>
                  <label className="form-label">
                    Prix de base (€) *
                  </label>
                  <input
                    type="number"
                    value={formData.base_price || ''}
                    onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
                    placeholder="25"
                    min="0"
                    step="0.01"
                    className="form-input w-24 text-center font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">
                    Durée de base *
                  </label>
                  <DurationPicker
                    value={formData.base_duration || ''}
                    onChange={(value) => handleInputChange('base_duration', value)}
                    className="form-input w-32"
                    required
                  />
                </div>
              </div>

              {/* Service Description */}
              <div>
                <label className="form-label">
                  Description du service
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t.serviceDescriptionPlaceholder}
                  rows={4}
                  className="form-input"
                />
              </div>
            </div>

            {/* Desktop: Image section with proper height */}
            <div className="hidden md:block">
              <div className="h-full flex flex-col">
                <div className="flex-1 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border mb-3">
                  {imagePreviewUrl ? <img src={imagePreviewUrl} alt="Service Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-gray-400" />}
                </div>
                <input type="file" id="serviceImageUpload" className="hidden" onChange={handleImageChange} accept="image/*" />
                <div className="flex gap-2">
                  <label htmlFor="serviceImageUpload" className="flex-1 block text-center bg-gray-200 text-neutral-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">{t.changeImage}</label>
                  {imagePreviewUrl && <button onClick={handleRemoveImage} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title={t.removeImage}><TrashIcon /></button>}
                </div>
              </div>
            </div>
          </div>
        </section>


        <section>
          <h3 className="font-bold text-lg border-b pb-2 mb-4">{t.formulas}</h3>
          <p className="text-sm text-brand-gray mb-4">{t.formulasSubtitle}</p>
          <div className="space-y-6">
            {formulas.map((formula, formulaIndex) => (
              <div key={formula.id || `new-${formulaIndex}`} className="p-4 border rounded-lg bg-gray-50">
                <div className="space-y-4">
                  {/* Formula Name with Trash button on same line */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="form-label">{t.formulaName}</label>
                      <input
                        value={formula.name || ''}
                        onChange={e => updateFormulaField(formulaIndex, 'name', e.target.value)}
                        placeholder={t.formulaNamePlaceholder}
                        className="form-input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFormula(formulaIndex)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Price and Duration Row - Compact inputs with aligned labels */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="form-label">{t.additionalPrice}</label>
                      <input
                        type="number"
                        value={formula.additionalPrice ?? ''}
                        onChange={e => updateFormulaField(formulaIndex, 'additionalPrice', e.target.value)}
                        className="form-input w-20 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="form-label">{t.additionalDuration}</label>
                      <DurationPicker
                        value={formula.additionalDuration ?? ''}
                        onChange={(value) => updateFormulaField(formulaIndex, 'additionalDuration', value)}
                        className="form-input w-32"
                        placeholder="Aucune"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">{t.whatsIncluded}</label>
                    <div className="space-y-2">
                      {getIncludedItems(formula).map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-center gap-2 group"
                        >
                          <div
                            className="cursor-grab text-gray-400 group-hover:text-gray-600"
                            draggable
                            onDragStart={() => (dragItem.current = itemIndex)}
                            onDragEnter={() => (dragOverItem.current = itemIndex)}
                            onDragEnd={() => handleDragSort(formulaIndex)}
                            onDragOver={(e) => e.preventDefault()}
                          >
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          </div>
                          <input
                            type="text"
                            value={item}
                            onChange={e => updateIncludedItem(formulaIndex, itemIndex, e.target.value)}
                            placeholder="e.g., Aspiration complète"
                            className="w-full p-2 border-gray-200 border rounded-lg"
                          />
                          <button type="button" onClick={() => removeIncludedItem(formulaIndex, itemIndex)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addIncludedItem(formulaIndex)} className="text-sm text-brand-blue font-semibold hover:underline">
                        {t.addFeature}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addFormula} className="mt-4 text-brand-blue font-semibold flex items-center gap-2"><PlusIcon className="w-5 h-5" /> {t.addFormula}</button>
        </section>

        <section>
          <h3 className="font-bold text-lg border-b pb-2 mb-4">{t.vehicleSizeSupplements}</h3>
          <p className="text-sm text-brand-gray mb-4">{t.vehicleSizeSupplementsSubtitle}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicleSizes.map(vehicleSize => {
              const supplement = supplements.find(s => s.vehicleSizeId === vehicleSize.id);
              return (
                <div key={vehicleSize.id} className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-brand-dark mb-3">
                    {vehicleSize.name}
                    {vehicleSize.subtitle && <span className="text-sm text-gray-500 block">{vehicleSize.subtitle}</span>}
                  </h4>
                  <div className="flex gap-3">
                    <div>
                      <label className="form-label">Prix additionnel (€)</label>
                      <input
                        type="number"
                        value={supplement?.additionalPrice ?? ''}
                        onChange={e => updateSupplement(vehicleSize.id, 'additionalPrice', e.target.value)}
                        placeholder="0"
                        className="form-input w-20 text-center"
                      />
                    </div>
                    <div>
                      <label className="form-label">Durée additionnelle</label>
                      <DurationPicker
                        value={supplement?.additionalDuration ?? ''}
                        onChange={(value) => updateSupplement(vehicleSize.id, 'additionalDuration', String(value))}
                        className="form-input w-32"
                        placeholder="Aucune"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-lg border-b pb-2 mb-4">{t.specificAddOns}</h3>
          <p className="text-sm text-brand-gray mb-4">{t.specificAddOnsSubtitle}</p>
          <div className="space-y-4">
            {specificAddOns.map((addOn, index) => (
              <div key={addOn.id || `new-add-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">{t.addOnName}</label>
                    <input value={addOn.name || ''} onChange={e => updateSpecificAddOn(index, 'name', e.target.value)} placeholder={t.addOnName} className="w-full p-2 border-gray-200 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Description (optionnel)</label>
                    <input value={addOn.description || ''} onChange={e => updateSpecificAddOn(index, 'description', e.target.value)} placeholder="Description de l'add-on" className="w-full p-2 border-gray-200 border rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">{t.priceEUR}</label>
                    <input type="number" value={addOn.price ?? ''} onChange={e => updateSpecificAddOn(index, 'price', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">{t.durationMIN}</label>
                    <input type="number" step="15" value={addOn.duration ?? ''} onChange={e => updateSpecificAddOn(index, 'duration', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeSpecificAddOn(index)} className="p-2 text-red-500 hover:text-red-700 transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSpecificAddOn} className="mt-4 text-brand-blue font-semibold flex items-center gap-2"><PlusIcon className="w-5 h-5" /> {t.addSpecificAddOn}</button>
        </section>

        <div className="flex justify-between items-center pt-6 border-t">
          {isEditing ? (
            <button type="button" onClick={handleDeleteClick} className="text-red-500 font-semibold flex items-center gap-2"><TrashIcon className="w-5 h-5" />{t.deleteService}</button>
          ) : (<div></div>)}
          <div className="flex gap-4">
            <button type="button" onClick={onBack} className="bg-gray-200 text-brand-dark font-bold py-2 px-6 rounded-lg hover:bg-gray-300">{t.cancel}</button>
            <button type="button" onClick={handleSaveClick} disabled={isSaving} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-75 min-w-[150px]">
              {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <><SaveIcon /><span>{isEditing ? t.saveChanges : t.createService}</span></>}
            </button>
          </div>
        </div>
      </div>
      <AlertModal
        isOpen={alertInfo.isOpen}
        onClose={() => setAlertInfo({ isOpen: false, title: '', message: '' })}
        title={alertInfo.title}
        message={alertInfo.message}
      />
    </div>
  );
};

export default ServiceEditor;
