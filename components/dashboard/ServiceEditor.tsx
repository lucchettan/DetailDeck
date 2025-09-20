

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, PlusIcon, TrashIcon, SaveIcon, CheckBadgeIcon, Bars3Icon } from '../Icons';
import { Service, Formula, VehicleSizeSupplement, AddOn } from '../Dashboard';
import { supabase } from '../../lib/supabaseClient';
import AlertModal from '../AlertModal';
import { toSnakeCase } from '../../lib/utils';

type FormulaWithIncluded = Omit<Partial<Formula>, 'description'> & { includedItems: string[] };

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
  const [formulas, setFormulas] = useState<FormulaWithIncluded[]>([]);
  const [supplements, setSupplements] = useState<Partial<VehicleSizeSupplement>[]>([]);
  const [specificAddOns, setSpecificAddOns] = useState<Partial<AddOn>[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);


  useEffect(() => {
    setFormData(getInitialFormData(serviceToEdit, initialCategory));
    const initialFormulas = (formulasForService.length > 0 ? formulasForService : [{ name: 'Basique', description: '', additionalPrice: 0, additionalDuration: 0 }]).map(f => ({
        ...f,
        includedItems: f.description ? f.description.split('\n').filter(line => line.trim() !== '') : []
    }));
    setFormulas(initialFormulas);
    setSupplements(supplementsForService);
    setSpecificAddOns(addOnsForService);
    setImagePreviewUrl(serviceToEdit?.imageUrl || null);
    setImageFile(null);
    setImageToDelete(null);
  }, [serviceToEdit, initialCategory, formulasForService, supplementsForService, addOnsForService]);

  const handleInputChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      if (serviceToEdit?.imageUrl === imagePreviewUrl) {
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
            if (serviceToEdit?.imageUrl && serviceToEdit.imageUrl !== imageToDelete) {
                const oldImagePath = serviceToEdit.imageUrl.split('/service-images/')[1];
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
        delete servicePayload.createdAt;

        const { data: savedService, error: serviceError } = await supabase
            .from('services')
            .upsert(toSnakeCase(servicePayload))
            .select()
            .single();
        
        if (serviceError) throw serviceError;
        const serviceId = savedService.id;

        const formulasToSave = formulas.map(f => {
            const formulaData: any = {...f, description: f.includedItems.join('\n').trim(), serviceId: serviceId};
            delete formulaData.includedItems;
            delete formulaData.createdAt;
            return formulaData;
        });
        
        const supplementsToSave = supplements.map(s => {
            const supplementData: any = { ...s, serviceId: serviceId };
            delete supplementData.createdAt;
            return supplementData;
        });
        const addOnsToSave = specificAddOns.map(a => {
            const addOnData: any = { ...a, serviceId: serviceId, shopId: shopId };
            delete addOnData.createdAt;
            return addOnData;
        });

        const upsertRelated = async (tableName: string, items: any[]) => {
            if (items.length === 0) return;
            const snakeCasedItems = items.map(toSnakeCase);
            const { error } = await supabase.from(tableName).upsert(snakeCasedItems);
            if (error) throw error;
        };

        const originalItemIds = {
            formulas: new Set(formulasForService.map(i => i.id)),
            supplements: new Set(supplementsForService.map(i => i.id)),
            addOns: new Set(addOnsForService.map(i => i.id)),
        };

        const deleteRelated = async (tableName: string, currentItems: any[], originalIds: Set<string>) => {
            const currentIds = new Set(currentItems.map(i => i.id).filter(Boolean));
            const idsToDelete = [...originalIds].filter(id => !currentIds.has(id));
            if (idsToDelete.length > 0) {
                const { error } = await supabase.from(tableName).delete().in('id', idsToDelete);
                if (error) throw error;
            }
        };

        await Promise.all([
            upsertRelated('formulas', formulasToSave),
            upsertRelated('service_vehicle_size_supplements', supplementsToSave),
            upsertRelated('add_ons', addOnsToSave),
            deleteRelated('formulas', formulas, originalItemIds.formulas),
            deleteRelated('service_vehicle_size_supplements', supplements, originalItemIds.supplements),
            deleteRelated('add_ons', specificAddOns, originalItemIds.addOns),
        ]);
        
        await onSave();

    } catch (error: any) {
        console.error("Save error:", error);
        setAlertInfo({ isOpen: true, title: "Save Error", message: `Error during save: ${error.message}` });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteClick = () => {
      if (serviceToEdit && window.confirm(t.deleteServiceConfirmation)) {
          onDelete(serviceToEdit.id);
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
                            {imagePreviewUrl ? <img src={imagePreviewUrl} alt="Service Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-gray-400" />}
                        </div>
                        <input type="file" id="serviceImageUpload" className="hidden" onChange={handleImageChange} accept="image/*" />
                        <div className="mt-2 flex gap-2">
                            <label htmlFor="serviceImageUpload" className="flex-1 block text-center bg-gray-200 text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">{t.changeImage}</label>
                            {imagePreviewUrl && <button onClick={handleRemoveImage} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title={t.removeImage}><TrashIcon /></button>}
                        </div>
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
                <div className="space-y-6">
                {formulas.map((formula, formulaIndex) => (
                    <div key={formula.id || `new-${formulaIndex}`} className="p-4 border rounded-lg bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-start">
                            <div className="md:col-span-4">
                               <label className="block text-sm font-medium text-gray-500 mb-1">{t.formulaName}</label>
                               <input value={formula.name || ''} onChange={e => updateFormulaField(formulaIndex, 'name', e.target.value)} placeholder={t.formulaNamePlaceholder} className="w-full p-2 border-gray-200 border rounded-lg" />
                            </div>
                            <div className="md:col-span-2">
                               <label className="block text-sm font-medium text-gray-500 mb-1">{t.additionalPrice}</label>
                               <input type="number" value={formula.additionalPrice ?? ''} onChange={e => updateFormulaField(formulaIndex, 'additionalPrice', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                            </div>
                            <div className="md:col-span-2">
                                 <label className="block text-sm font-medium text-gray-500 mb-1">{t.additionalDuration}</label>
                                 <input type="number" step="15" value={formula.additionalDuration ?? ''} onChange={e => updateFormulaField(formulaIndex, 'additionalDuration', e.target.value)} className="w-full p-2 border-gray-200 border rounded-lg" />
                            </div>
                            <div className="md:col-span-2 flex justify-end items-center pt-6">
                               <button type="button" onClick={() => removeFormula(formulaIndex)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="w-6 h-6"/></button>
                            </div>

                            <div className="md:col-span-10 mt-2">
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
                                            <input 
                                                type="text"
                                                value={item}
                                                onChange={e => updateIncludedItem(formulaIndex, itemIndex, e.target.value)}
                                                placeholder="e.g., Aspiration complète"
                                                className="w-full p-2 border-gray-200 border rounded-lg"
                                            />
                                            <button type="button" onClick={() => removeIncludedItem(formulaIndex, itemIndex)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
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