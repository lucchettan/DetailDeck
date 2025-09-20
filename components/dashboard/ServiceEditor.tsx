import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, PlusIcon, TrashIcon, SaveIcon } from '../Icons';
import { Service, Formula, VehicleSizeSupplement, AddOn } from '../Dashboard';
import { supabase } from '../../lib/supabaseClient';
import AlertModal from '../AlertModal';

interface ServiceEditorProps {
  serviceToEdit: Service | null;
  initialCategory: 'interior' | 'exterior' | 'complementary';
  formulasForService: Formula[];
  supplementsForService: VehicleSizeSupplement[];
  addOnsForService: AddOn[];
  shopId: string;
  supportedVehicleSizes: string[];
  onBack: () => void;
  onSave: () => Promise<boolean | void>;
  onDelete: (serviceId: string) => void;
}

const getInitialFormData = (service: Service | null, initialCategory: 'interior' | 'exterior' | 'complementary'): Partial<Service> => {
  if (service) return { ...service };

  return {
    name: '',
    description: '',
    status: 'active',
    category: initialCategory,
    basePrice: 50,
    baseDuration: 60,
    imageUrl: '',
  };
};

const ServiceEditor: React.FC<ServiceEditorProps> = ({
  serviceToEdit,
  initialCategory,
  formulasForService,
  supplementsForService,
  addOnsForService,
  shopId,
  supportedVehicleSizes,
  onBack,
  onSave,
  onDelete
}) => {
  const { t } = useLanguage();
  const isEditing = serviceToEdit !== null;

  const [formData, setFormData] = useState<Partial<Service>>(getInitialFormData(serviceToEdit, initialCategory));
  const [formulas, setFormulas] = useState<Partial<Formula>[]>([]);
  const [supplements, setSupplements] = useState<Partial<VehicleSizeSupplement>[]>([]);
  const [specificAddOns, setSpecificAddOns] = useState<Partial<AddOn>[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });


  useEffect(() => {
    setFormData(getInitialFormData(serviceToEdit, initialCategory));
    setFormulas(formulasForService.length > 0 ? formulasForService : []);
    setSupplements(supplementsForService);
    setSpecificAddOns(addOnsForService);
  }, [serviceToEdit, initialCategory, formulasForService, supplementsForService, addOnsForService]);

  const handleInputChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !shopId) {
      return;
    }
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${shopId}/${fileName}`;

    // Optimistic UI update with local file
    const reader = new FileReader();
    reader.onload = (event) => {
      handleInputChange('imageUrl', event.target?.result as string);
    };
    reader.readAsDataURL(file);

    const { error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setAlertInfo({ 
        isOpen: true, 
        title: "Image Upload Failed", 
        message: `Error: ${uploadError.message}.\n\nPlease ensure you have created a public bucket named 'service-images' in your Supabase project's Storage section.` 
      });
      handleInputChange('imageUrl', serviceToEdit?.imageUrl || ''); // Revert on failure
      return;
    }

    const { data } = supabase.storage
      .from('service-images')
      .getPublicUrl(filePath);

    if (data) {
      handleInputChange('imageUrl', data.publicUrl);
    }
  };


  const handleSaveClick = async () => {
    if (!shopId) {
        setAlertInfo({ isOpen: true, title: "Error", message: "Shop ID is missing. Cannot save." });
        return;
    }
    setIsSaving(true);
    try {
        // 1. Upsert Service
        const servicePayload = {
            shop_id: shopId,
            name: formData.name,
            description: formData.description,
            status: formData.status,
            category: formData.category,
            base_price: formData.basePrice,
            base_duration: formData.baseDuration,
            image_url: formData.imageUrl,
            ...(formData.id && { id: formData.id }),
        };

        const { data: savedService, error: serviceError } = await supabase
            .from('services')
            .upsert(servicePayload)
            .select()
            .single();
        
        if (serviceError) throw serviceError;
        const serviceId = savedService.id;

        // 2. Handle Formulas (Robustly)
        const existingFormulas = formulas.filter(f => f.id);
        const newFormulas = formulas.filter(f => !f.id);
        const formulaIdsToKeep = new Set(existingFormulas.map(f => f.id));
        const formulasToDelete = formulasForService.filter(f => !formulaIdsToKeep.has(f.id));

        if (formulasToDelete.length > 0) {
            await supabase.from('formulas').delete().in('id', formulasToDelete.map(f => f.id!));
        }
        if (existingFormulas.length > 0) {
            await supabase.from('formulas').upsert(existingFormulas.map(f => ({ ...f, service_id: serviceId })));
        }
        if (newFormulas.length > 0) {
            await supabase.from('formulas').insert(newFormulas.map(f => ({ ...f, service_id: serviceId })));
        }
        
        if (!isEditing && formulas.length === 0) {
          await supabase.from('formulas').insert({ service_id: serviceId, name: t.formulas, description: '', additional_price: 0, additional_duration: 0 });
        }
      
        // 3. Handle Supplements
        const supplementPayloads = supportedVehicleSizes.map(size => {
            const existing = supplements.find(s => s.size === size);
            return {
                id: existing?.id,
                service_id: serviceId,
                size: size,
                additional_price: existing?.additionalPrice || 0,
                additional_duration: existing?.additionalDuration || 0,
            };
        }).filter(s => s.additional_price || s.additional_duration || s.id);

        if (supplementPayloads.length > 0) {
            await supabase.from('service_vehicle_size_supplements').upsert(supplementPayloads);
        }

        // 4. Handle Specific Add-Ons (Robustly)
        const existingAddOns = specificAddOns.filter(a => a.id);
        const newAddOns = specificAddOns.filter(a => !a.id);
        const addOnIdsToKeep = new Set(existingAddOns.map(a => a.id));
        const addOnsToDelete = addOnsForService.filter(a => !addOnIdsToKeep.has(a.id));

        if (addOnsToDelete.length > 0) {
            await supabase.from('add_ons').delete().in('id', addOnsToDelete.map(a => a.id!));
        }
        if (existingAddOns.length > 0) {
            await supabase.from('add_ons').upsert(existingAddOns.map(a => ({ ...a, shop_id: shopId, service_id: serviceId })));
        }
        if (newAddOns.length > 0) {
            await supabase.from('add_ons').insert(newAddOns.map(a => ({ ...a, shop_id: shopId, service_id: serviceId })));
        }
        
        await onSave();

    } catch (error: any) {
        console.error("Save error:", error);
        setAlertInfo({ isOpen: true, title: "Save Error", message: error.message });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteClick = () => {
      if (serviceToEdit && window.confirm(t.deleteServiceConfirmation)) {
          onDelete(serviceToEdit.id);
      }
  }

  const addFormula = () => setFormulas(prev => [...prev, { name: '', description: '', additionalPrice: 10, additionalDuration: 15 }]);
  const updateFormula = (index: number, field: keyof Formula, value: any) => {
      const newFormulas = [...formulas];
      const val = (field === 'additionalPrice' || field === 'additionalDuration') ? Number(value) : value;
      (newFormulas[index] as any)[field] = val;
      setFormulas(newFormulas);
  };
  const removeFormula = (index: number) => setFormulas(formulas.filter((_, i) => i !== index));
  
  const addSpecificAddOn = () => setSpecificAddOns(prev => [...prev, { name: '', price: 10, duration: 15 }]);
  const updateSpecificAddOn = (index: number, field: keyof AddOn, value: any) => {
      const newAddons = [...specificAddOns];
      const val = (field === 'price' || field === 'duration') ? Number(value) : value;
      (newAddons[index] as any)[field] = val;
      setSpecificAddOns(newAddons);
  };
  const removeSpecificAddOn = (index: number) => setSpecificAddOns(specificAddOns.filter((_, i) => i !== index));

  const updateSupplement = (size: string, field: 'additionalPrice' | 'additionalDuration', value: string) => {
    const numValue = Number(value);
    setSupplements(prev => {
        const existingIndex = prev.findIndex(s => s.size === size);
        if (existingIndex > -1) {
            const newSupplements = [...prev];
            (newSupplements[existingIndex] as any)[field] = numValue;
            return newSupplements;
        } else {
            const newSupplement: Partial<VehicleSizeSupplement> = { size, additionalPrice: 0, additionalDuration: 0 };
            (newSupplement as any)[field] = numValue;
            return [...prev, newSupplement];
        }
    });
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-dark">{isEditing ? t.editService : t.addNewService}</h2>
          <button type="button" onClick={onBack} className="text-brand-gray hover:text-brand-dark">&larr; {t.catalog}</button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md space-y-8">
            <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                       <input value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder={t.serviceNamePlaceholder} className="w-full p-2 text-lg font-bold border-gray-200 border rounded-lg" />
                       <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} placeholder={t.serviceDescriptionPlaceholder} rows={4} className="w-full p-2 border-gray-200 border rounded-lg" />
                       <div className="grid grid-cols-2 gap-4">
                           <select value={formData.category || initialCategory} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full p-2 border-gray-200 border bg-white rounded-lg">
                               <option value="interior">{t.interior}</option>
                               <option value="exterior">{t.exterior}</option>
                               <option value="complementary">{t.complementary}</option>
                           </select>
                           <select value={formData.status || 'active'} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full p-2 border-gray-200 border bg-white rounded-lg">
                               <option value="active">{t.active}</option>
                               <option value="inactive">{t.inactive}</option>
                           </select>
                       </div>
                    </div>
                    <div>
                        <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                            {formData.imageUrl ? <img src={formData.imageUrl} alt="Service" className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-gray-400" />}
                        </div>
                        <input type="file" id="serviceImageUpload" className="hidden" onChange={handleImageChange} accept="image/*" />
                        <label htmlFor="serviceImageUpload" className="mt-2 w-full block text-center bg-gray-200 text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">{t.uploadImage}</label>
                    </div>
                </div>
            </section>

            <section>
              <h3 className="font-bold text-lg border-b pb-2 mb-4">{t.basePriceAndDuration}</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">{t.priceEUR}</label>
                      <input type="number" value={formData.basePrice || ''} onChange={e => handleInputChange('basePrice', Number(e.target.value))} className="w-full p-2 border-gray-200 border rounded-lg" />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">{t.durationMIN}</label>
                      <input type="number" step="15" value={formData.baseDuration || ''} onChange={e => handleInputChange('baseDuration', Number(e.target.value))} className="w-full p-2 border-gray-200 border rounded-lg" />
                  </div>
              </div>
            </section>

            <section>
                <h3 className="font-bold text-lg border-b pb-2 mb-4">{t.formulas}</h3>
                <p className="text-sm text-brand-gray mb-4">{t.formulasSubtitle}</p>
                <div className="space-y-4">
                {formulas.map((formula, index) => (
                    <div key={formula.id || `new-${index}`} className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end">
                        <div className="md:col-span-3">
                           <label className="block text-xs font-medium text-gray-500 mb-1">{t.formulaName}</label>
                           <input value={formula.name || ''} onChange={e => updateFormula(index, 'name', e.target.value)} placeholder={t.formulaNamePlaceholder} className="w-full p-2 border-gray-200 border rounded-lg" />
                        </div>
                        <div className="md:col-span-3">
                           <label className="block text-xs font-medium text-gray-500 mb-1">{t.formulaDescription}</label>
                           <textarea value={formula.description || ''} onChange={e => updateFormula(index, 'description', e.target.value)} placeholder={t.formulaDescriptionPlaceholder} rows={1} className="w-full p-2 border-gray-200 border rounded-lg" />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-xs font-medium text-gray-500 mb-1">{t.additionalPrice} (€)</label>
                           <input type="number" value={formula.additionalPrice || ''} onChange={e => updateFormula(index, 'additionalPrice', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                          <div className="flex-grow">
                             <label className="block text-xs font-medium text-gray-500 mb-1">{t.additionalDuration} (min)</label>
                             <input type="number" step="15" value={formula.additionalDuration || ''} onChange={e => updateFormula(index, 'additionalDuration', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                          </div>
                           <button type="button" onClick={() => removeFormula(index)} className="p-2 mb-1"><TrashIcon className="text-red-500 w-6 h-6"/></button>
                        </div>
                    </div>
                ))}
                </div>
                <button type="button" onClick={addFormula} className="mt-4 text-brand-blue font-semibold flex items-center gap-2"><PlusIcon className="w-5 h-5"/> {t.addFormula}</button>
            </section>
            
            <section>
                <h3 className="font-bold text-lg border-b pb-2 mb-4">{t.vehicleSizeSupplements}</h3>
                <p className="text-sm text-brand-gray mb-4">{t.vehicleSizeSupplementsSubtitle}</p>
                <div className="space-y-3">
                    {supportedVehicleSizes.map(size => {
                       const supplement = supplements.find(s=>s.size === size);
                       return (
                        <div key={size} className="grid grid-cols-3 gap-4 items-center">
                            <label className="font-semibold">{t[`size_${size as 'S'|'M'|'L'|'XL'}`]}</label>
                            <input type="number" value={supplement?.additionalPrice ?? ''} onChange={e => updateSupplement(size, 'additionalPrice', e.target.value)} placeholder={`${t.priceEUR}`} className="p-2 border-gray-200 border rounded-lg" />
                            <input type="number" step="15" value={supplement?.additionalDuration ?? ''} onChange={e => updateSupplement(size, 'additionalDuration', e.target.value)} placeholder={`${t.durationMIN}`} className="p-2 border-gray-200 border rounded-lg" />
                        </div>
                    )})}
                </div>
            </section>
            
            <section>
                <h3 className="font-bold text-lg border-b pb-2 mb-4">{t.specificAddOns}</h3>
                <p className="text-sm text-brand-gray mb-4">{t.specificAddOnsSubtitle}</p>
                <div className="space-y-4">
                {specificAddOns.map((addOn, index) => (
                    <div key={addOn.id || `new-add-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                           <label className="block text-xs font-medium text-gray-500 mb-1">{t.addOnName}</label>
                           <input value={addOn.name || ''} onChange={e => updateSpecificAddOn(index, 'name', e.target.value)} placeholder={t.addOnName} className="w-full p-2 border-gray-200 border rounded-lg" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-500 mb-1">{t.priceEUR}</label>
                           <input type="number" value={addOn.price ?? ''} onChange={e => updateSpecificAddOn(index, 'price', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-grow">
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t.durationMIN}</label>
                            <input type="number" step="15" value={addOn.duration ?? ''} onChange={e => updateSpecificAddOn(index, 'duration', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                          </div>
                           <button type="button" onClick={() => removeSpecificAddOn(index)} className="p-2 mb-1"><TrashIcon className="text-red-500 w-6 h-6"/></button>
                        </div>
                    </div>
                ))}
                </div>
                <button type="button" onClick={addSpecificAddOn} className="mt-4 text-brand-blue font-semibold flex items-center gap-2"><PlusIcon className="w-5 h-5"/> {t.addSpecificAddOn}</button>
            </section>
            
            <div className="flex justify-between items-center pt-6 border-t">
                {isEditing ? (
                  <button type="button" onClick={handleDeleteClick} className="text-red-500 font-semibold flex items-center gap-2"><TrashIcon className="w-5 h-5"/>{t.deleteService}</button>
                ) : (<div></div>)}
                <div className="flex gap-4">
                  <button type="button" onClick={onBack} className="bg-gray-200 text-brand-dark font-bold py-2 px-6 rounded-lg hover:bg-gray-300">{t.cancel}</button>
                  <button type="button" onClick={handleSaveClick} disabled={isSaving} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-75 min-w-[150px]">
                    {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <><SaveIcon/><span>{isEditing ? t.saveChanges : t.createService}</span></>}
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