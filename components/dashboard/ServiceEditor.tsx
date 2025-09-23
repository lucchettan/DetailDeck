import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, PlusIcon, TrashIcon, SaveIcon, CheckCircleIcon, Bars3Icon } from '../Icons';
import { Service, Formula, VehicleSizeSupplement, AddOn, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';
import { supabase } from '../../lib/supabaseClient';
import AlertModal from '../AlertModal';
import { toSnakeCase, toCamelCase } from '../../lib/utils';
import { IS_MOCK_MODE } from '../../lib/env';
import DurationPicker from '../common/DurationPicker';

type FormulaWithIncluded = Omit<Partial<Formula>, 'description'> & { includedItems: string[] };

interface ServiceEditorProps {
  serviceId: string | 'new';
  shopId: string;
  supportedVehicleSizes: string[]; // Deprecated - keeping for compatibility
  vehicleSizes: ShopVehicleSize[];
  serviceCategories: ShopServiceCategory[];
  onBack: () => void;
  onSave: () => void;
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

  const [formData, setFormData] = useState<Partial<Service>>({});
  const [formulas, setFormulas] = useState<FormulaWithIncluded[]>([]);
  const [supplements, setSupplements] = useState<Partial<VehicleSizeSupplement>[]>([]);
  const [specificAddOns, setSpecificAddOns] = useState<Partial<AddOn>[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const initializeState = async () => {
      setLoading(true);

      const setupNewService = () => {
        setFormData({ name: '', description: '', status: 'active', category: 'interior', basePrice: 50, baseDuration: 60 });
        setFormulas([{ name: 'Basique', includedItems: [], additionalPrice: 0, additionalDuration: 0 }]);
        setSupplements([]);
        setSpecificAddOns([]);
        setLoading(false);
      };

      if (serviceId === 'new') {
        setupNewService();
        return;
      }

      if (IS_MOCK_MODE) {
        if (initialData) {
          const { formulas: initialFormulas, supplements: initialSupplements, specificAddOns: initialAddOns, ...serviceData } = initialData;
          setFormData(serviceData);
          setImagePreviewUrl(serviceData.imageUrl || null);
          setFormulas(initialFormulas.map(f => ({ ...f, includedItems: f.description ? f.description.split('\n').filter(Boolean) : [] })));
          setSupplements(initialSupplements);
          setSpecificAddOns(initialAddOns);
        }
        setLoading(false);
      } else {
        // Real mode fetch for editing
        try {
          const { data: service, error: serviceError } = await supabase.from('services').select('*').eq('id', serviceId).single();
          if (serviceError) throw serviceError;

          const [formulasRes, supplementsRes, addOnsRes] = await Promise.all([
            supabase.from('formulas').select('*').eq('service_id', serviceId),
            supabase.from('service_vehicle_size_supplements').select('*').eq('service_id', serviceId),
            supabase.from('add_ons').select('*').eq('service_id', serviceId)
          ]);

          if (formulasRes.error || supplementsRes.error || addOnsRes.error) throw new Error("Failed to fetch service details");

          setFormData(toCamelCase(service) as Service);
          setImagePreviewUrl(service.image_url || null);

          const fetchedFormulas = toCamelCase(formulasRes.data) as Formula[];
          setFormulas((fetchedFormulas.length > 0 ? fetchedFormulas : [{ name: 'Basique', description: '', additionalPrice: 0, additionalDuration: 0 }]).map(f => ({
            ...f,
            includedItems: f.description ? f.description.split('\n').filter(line => line.trim() !== '') : []
          })));

          setSupplements(toCamelCase(supplementsRes.data) as VehicleSizeSupplement[]);
          setSpecificAddOns(toCamelCase(addOnsRes.data) as AddOn[]);
        } catch (error: any) {
          console.error("Error fetching service data:", error);
          setAlertInfo({ isOpen: true, title: "Fetch Error", message: `Failed to load service data: ${error.message}` });
          onBack();
        } finally {
          setLoading(false);
        }
      }
    };

    initializeState();
  }, [serviceId, initialData, onBack]);

  const handleInputChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      if (formData.imageUrl === imagePreviewUrl) {
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
    if (IS_MOCK_MODE) {
      console.log('%c[MOCK MODE]%c Simulating save for service.', 'color: purple; font-weight: bold;', 'color: inherit;');
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setAlertInfo({ isOpen: true, title: 'Démo', message: 'La sauvegarde est simulée en mode démo.' });
        onSave();
      }, 1000);
      return;
    }

    if (!shopId) {
      setAlertInfo({ isOpen: true, title: "Error", message: "Shop ID is missing. Cannot save." });
      return;
    }
    setIsSaving(true);
    let finalImageUrl = formData.imageUrl;

    try {
      if (imageToDelete) {
        const oldImagePath = imageToDelete.split('/service-images/')[1];
        if (oldImagePath) {
          await supabase.storage.from('service-images').remove([oldImagePath]);
        }
        finalImageUrl = '';
      }

      if (imageFile) {
        if (formData.imageUrl && formData.imageUrl !== imageToDelete) {
          const oldImagePath = formData.imageUrl.split('/service-images/')[1];
          if (oldImagePath) await supabase.storage.from('service-images').remove([oldImagePath]);
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${shopId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('service-images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('service-images').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }

      const servicePayload: any = { ...formData, shopId, imageUrl: finalImageUrl };
      if (!isEditing) delete servicePayload.id;
      delete servicePayload.createdAt;

      const { data: savedService, error: serviceError } = await supabase
        .from('services')
        .upsert(toSnakeCase(servicePayload))
        .select()
        .single();

      if (serviceError) throw serviceError;
      const currentServiceId = savedService.id;

      // --- DELETION PHASE ---
      if (isEditing) {
        const { error: deleteFormulasError } = await supabase.from('formulas').delete().eq('service_id', currentServiceId);
        if (deleteFormulasError) throw deleteFormulasError;
        const { error: deleteSupplementsError } = await supabase.from('service_vehicle_size_supplements').delete().eq('service_id', currentServiceId);
        if (deleteSupplementsError) throw deleteSupplementsError;
        const { error: deleteAddonsError } = await supabase.from('add_ons').delete().eq('service_id', currentServiceId);
        if (deleteAddonsError) throw deleteAddonsError;
      }

      // --- RE-INSERTION PHASE ---
      const formulasToInsert = formulas.map(f => ({
        service_id: currentServiceId,
        name: f.name || 'Nouvelle Formule',
        description: f.includedItems.join('\n').trim(),
        additional_price: f.additionalPrice || 0,
        additional_duration: f.additionalDuration || 0,
      }));
      if (formulasToInsert.length > 0) {
        const { error } = await supabase.from('formulas').insert(formulasToInsert);
        if (error) throw error;
      }

      const supplementsToInsert = supplements.filter(s => s.size).map(s => ({
        service_id: currentServiceId,
        size: s.size,
        additional_price: s.additionalPrice || 0,
        additional_duration: s.additionalDuration || 0,
      }));
      if (supplementsToInsert.length > 0) {
        const { error } = await supabase.from('service_vehicle_size_supplements').insert(supplementsToInsert);
        if (error) throw error;
      }

      const addOnsToInsert = specificAddOns.map(a => ({
        service_id: currentServiceId,
        shop_id: shopId,
        name: a.name || 'Nouvelle Option',
        price: a.price || 0,
        duration: a.duration || 0,
      }));
      if (addOnsToInsert.length > 0) {
        const { error } = await supabase.from('add_ons').insert(addOnsToInsert);
        if (error) throw error;
      }

      onSave();

    } catch (error: any) {
      console.error("Save error:", error);
      setAlertInfo({ isOpen: true, title: "Save Error", message: `Error during save: ${error.message}` });
    } finally {
      setIsSaving(false);
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

  const addFormula = () => setFormulas(prev => [...prev, { name: '', includedItems: [], additionalPrice: 10, additionalDuration: 15 }]);
  const updateFormulaField = (index: number, field: keyof FormulaWithIncluded, value: any) => {
    const newFormulas = [...formulas];
    const val = (field === 'additionalPrice' || field === 'additionalDuration') ? Number(value) : value;
    (newFormulas[index] as any)[field] = val;
    setFormulas(newFormulas);
  };
  const removeFormula = (index: number) => setFormulas(formulas.filter((_, i) => i !== index));

  const addIncludedItem = (formulaIndex: number) => {
    const newFormulas = [...formulas];
    newFormulas[formulaIndex].includedItems.push('');
    setFormulas(newFormulas);
  }
  const updateIncludedItem = (formulaIndex: number, itemIndex: number, value: string) => {
    const newFormulas = [...formulas];
    newFormulas[formulaIndex].includedItems[itemIndex] = value;
    setFormulas(newFormulas);
  }
  const removeIncludedItem = (formulaIndex: number, itemIndex: number) => {
    const newFormulas = [...formulas];
    newFormulas[formulaIndex].includedItems.splice(itemIndex, 1);
    setFormulas(newFormulas);
  }

  const handleDragSort = (formulaIndex: number) => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const newFormulas = [...formulas];
    const formulaToUpdate = newFormulas[formulaIndex];
    const newIncludedItems = [...formulaToUpdate.includedItems];

    const dragItemContent = newIncludedItems.splice(dragItem.current, 1)[0];
    newIncludedItems.splice(dragOverItem.current, 0, dragItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    formulaToUpdate.includedItems = newIncludedItems;
    setFormulas(newFormulas);
  };

  const addSpecificAddOn = () => setSpecificAddOns(prev => [...prev, { name: '', price: 10, duration: 15 }]);
  const updateSpecificAddOn = (index: number, field: keyof AddOn, value: any) => {
    const newAddons = [...specificAddOns];
    const val = (field === 'price' || field === 'duration') ? Number(value) : value;
    (newAddons[index] as any)[field] = val;
    setSpecificAddOns(newAddons);
  };
  const removeSpecificAddOn = (index: number) => setSpecificAddOns(specificAddOns.filter((_, i) => i !== index));

  const updateSupplement = (vehicleSizeId: string, field: 'additionalPrice' | 'additionalDuration', value: string) => {
    const numValue = Number(value);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-dark">{isEditing ? t.editService : t.addNewService}</h2>
        <button type="button" onClick={onBack} className="text-brand-gray hover:text-brand-dark">&larr; {t.catalog}</button>
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
                    value={formData.categoryId || ''}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="" disabled>Choisir une catégorie</option>
                    {serviceCategories.filter(cat => cat.isActive).map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Statut du service
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="form-input"
                  >
                    <option value="active">{t.active}</option>
                    <option value="inactive">{t.inactive}</option>
                  </select>
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
                    value={formData.basePrice || ''}
                    onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
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
                    value={formData.baseDuration || ''}
                    onChange={(value) => handleInputChange('baseDuration', value)}
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
                  {/* Formula Name */}
                  <div>
                    <label className="form-label">{t.formulaName}</label>
                    <input
                      value={formula.name || ''}
                      onChange={e => updateFormulaField(formulaIndex, 'name', e.target.value)}
                      placeholder={t.formulaNamePlaceholder}
                      className="form-input"
                    />
                  </div>

                  {/* Price and Duration Row */}
                  <div className="flex gap-4 items-end">
                    <div>
                      <label className="form-label">{t.additionalPrice}</label>
                      <input
                        type="number"
                        value={formula.additionalPrice ?? ''}
                        onChange={e => updateFormulaField(formulaIndex, 'additionalPrice', e.target.value)}
                        className="form-input w-24 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="form-label">{t.additionalDuration}</label>
                      <DurationPicker
                        value={formula.additionalDuration ?? ''}
                        onChange={(value) => updateFormulaField(formulaIndex, 'additionalDuration', value)}
                        className="form-input w-32"
                        placeholder="Aucune"
                      />
                    </div>
                    <div className="ml-auto">
                      <button
                        type="button"
                        onClick={() => removeFormula(formulaIndex)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">{t.whatsIncluded}</label>
                    <div className="space-y-2">
                      {formula.includedItems.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-center gap-2 group"
                          draggable
                          onDragStart={() => (dragItem.current = itemIndex)}
                          onDragEnter={() => (dragOverItem.current = itemIndex)}
                          onDragEnd={() => handleDragSort(formulaIndex)}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="cursor-grab text-gray-400 group-hover:text-gray-600">
                            <Bars3Icon className="w-5 h-5" />
                          </div>
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
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
                      <button type="button" onClick={() => addIncludedItem(formulaIndex)} className="text-sm text-brand-blue font-semibold hover:underline flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" /> {t.addFeature}
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
            {vehicleSizes.filter(vs => vs.isActive).map(vehicleSize => {
              const supplement = supplements.find(s => s.vehicleSizeId === vehicleSize.id);
              return (
                <div key={vehicleSize.id} className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-brand-dark mb-3">
                    {vehicleSize.name}
                    {vehicleSize.subtitle && <span className="text-sm text-gray-500 block">{vehicleSize.subtitle}</span>}
                  </h4>
                  <div className="flex gap-3">
                    <div>
                      <label className="form-label">Prix (€)</label>
                      <input
                        type="number"
                        value={supplement?.additionalPrice ?? ''}
                        onChange={e => updateSupplement(vehicleSize.id, 'additionalPrice', e.target.value)}
                        placeholder="0"
                        className="form-input w-20 text-center"
                      />
                    </div>
                    <div>
                      <label className="form-label">Durée</label>
                      <DurationPicker
                        value={supplement?.additionalDuration ?? ''}
                        onChange={(value) => updateSupplement(vehicleSize.id, 'additionalDuration', String(value))}
                        className="form-input w-28"
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
              <div key={addOn.id || `new-add-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.addOnName}</label>
                  <input value={addOn.name || ''} onChange={e => updateSpecificAddOn(index, 'name', e.target.value)} placeholder={t.addOnName} className="w-full p-2 border-gray-200 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.priceEUR}</label>
                  <input type="number" value={addOn.price ?? ''} onChange={e => updateSpecificAddOn(index, 'price', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-500 mb-1">{t.durationMIN}</label>
                    <input type="number" step="15" value={addOn.duration ?? ''} onChange={e => updateSpecificAddOn(index, 'duration', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                  </div>
                  <button type="button" onClick={() => removeSpecificAddOn(index)} className="p-2 mb-1"><TrashIcon className="text-red-500 w-6 h-6" /></button>
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
