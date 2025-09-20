
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, PlusIcon, TrashIcon, SaveIcon, MoneyIcon, HourglassIcon } from '../Icons';
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
  onSave: (serviceData: any) => Promise<boolean | void>;
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
  // We'll manage specific add-ons here
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Image handling logic would go here, e.g., upload to Supabase Storage
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      // 1. Upsert Service
      const servicePayload: any = {
        shop_id: shopId,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        category: formData.category,
        base_price: formData.basePrice,
        base_duration: formData.baseDuration,
        image_url: formData.imageUrl,
      };

      let serviceId = formData.id;
      if (isEditing) {
        servicePayload.id = serviceId;
      }

      const { data: savedService, error: serviceError } = await supabase
        .from('services')
        .upsert(servicePayload)
        .select()
        .single();
      
      if (serviceError) throw serviceError;
      serviceId = savedService.id;

      if (!isEditing) {
          // If new service, create default "Basique" formula
          await supabase.from('formulas').insert({
              service_id: serviceId,
              name: 'Basique',
              additional_price: 0,
              additional_duration: 0,
          });
      } else {
        // For existing services, handle formula deletions
        const incomingFormulaIds = new Set(formulas.map(f => f.id).filter(Boolean));
        const formulasToDelete = formulasForService.filter(f => !incomingFormulaIds.has(f.id));
        if (formulasToDelete.length > 0) {
            await supabase.from('formulas').delete().in('id', formulasToDelete.map(f => f.id));
        }
      }

      // 2. Upsert Formulas
      if (formulas.length > 0) {
        const formulaPayloads = formulas.map(f => ({
            ...f,
            service_id: serviceId,
            additional_price: f.additionalPrice,
            additional_duration: f.additionalDuration,
        }));
        const { error: formulasError } = await supabase.from('formulas').upsert(formulaPayloads);
        if (formulasError) throw formulasError;
      }
      
      // 3. Upsert Supplements
      const supplementPayloads = supportedVehicleSizes.map(size => {
        const existing = supplements.find(s => s.size === size);
        return {
            id: existing?.id, // for upsert
            service_id: serviceId,
            size: size,
            additional_price: existing?.additionalPrice || 0,
            additional_duration: existing?.additionalDuration || 0,
        }
      }).filter(s => s.additional_price > 0 || s.additional_duration > 0 || s.id); // Only save if there's a value or it exists already
       if (supplementPayloads.length > 0) {
        const { error: supplementsError } = await supabase.from('service_vehicle_size_supplements').upsert(supplementPayloads);
        if (supplementsError) throw supplementsError;
       }
      
      // 4. Upsert Specific Add-ons (and handle deletes)
      const incomingAddonIds = new Set(specificAddOns.map(a => a.id).filter(Boolean));
      const addOnsToDelete = addOnsForService.filter(a => !incomingAddonIds.has(a.id));
      if (addOnsToDelete.length > 0) {
        await supabase.from('add_ons').delete().in('id', addOnsToDelete.map(a => a.id));
      }

      if (specificAddOns.length > 0) {
        const addOnPayloads = specificAddOns.map(a => ({
            ...a,
            shop_id: shopId,
            service_id: serviceId
        }));
        const { error: addOnsError } = await supabase.from('add_ons').upsert(addOnPayloads);
        if (addOnsError) throw addOnsError;
      }
      
      onSave({}); // Trigger refetch in parent

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

  const addFormula = () => setFormulas(prev => [...prev, { name: '', additionalPrice: 10, additionalDuration: 15 }]);
  const updateFormula = (index: number, field: keyof Formula, value: any) => {
      const newFormulas = [...formulas];
      const val = (field === 'additionalPrice' || field === 'additionalDuration') ? Number(value) : value;
      (newFormulas[index] as any)[field] = val;
      setFormulas(newFormulas);
  };
  const removeFormula = (index: number) => setFormulas(formulas.filter((_, i) => i !== index));

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
                       <input value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder={t.serviceNamePlaceholder} className="w-full p-2 text-lg font-bold border rounded-lg" />
                       <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} placeholder={t.serviceDescriptionPlaceholder} rows={4} className="w-full p-2 border rounded-lg" />
                       <div className="grid grid-cols-2 gap-4">
                           <select value={formData.category || initialCategory} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full p-2 border bg-white rounded-lg">
                               <option value="interior">{t.interior}</option>
                               <option value="exterior">{t.exterior}</option>
                               <option value="complementary">{t.complementary}</option>
                           </select>
                           <select value={formData.status || 'active'} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full p-2 border bg-white rounded-lg">
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
                      <label className="block text-sm font-medium text-brand-dark mb-1">Prix de base (€)</label>
                      <input type="number" value={formData.basePrice || ''} onChange={e => handleInputChange('basePrice', Number(e.target.value))} className="w-full p-2 border rounded-lg" />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Durée de base (minutes)</label>
                      <input type="number" step="15" value={formData.baseDuration || ''} onChange={e => handleInputChange('baseDuration', Number(e.target.value))} className="w-full p-2 border rounded-lg" />
                  </div>
              </div>
            </section>

            <section>
                <h3 className="font-bold text-lg border-b pb-2 mb-4">{t.formulas}</h3>
                <p className="text-sm text-brand-gray mb-4">{t.formulasSubtitle}</p>
                <div className="space-y-4">
                {formulas.map((formula, index) => (
                    <div key={formula.id || `new-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <input value={formula.name || ''} onChange={e => updateFormula(index, 'name', e.target.value)} placeholder={t.formulaNamePlaceholder} className="md:col-span-2 w-full p-2 border rounded-lg" />
                        <input type="number" value={formula.additionalPrice || ''} onChange={e => updateFormula(index, 'additionalPrice', e.target.value)} placeholder={t.additionalPrice} className="w-full p-2 border rounded-lg" />
                        <div className="flex items-center gap-2">
                          <input type="number" step="15" value={formula.additionalDuration || ''} onChange={e => updateFormula(index, 'additionalDuration', e.target.value)} placeholder={t.additionalDuration} className="w-full p-2 border rounded-lg" />
                           <button type="button" onClick={() => removeFormula(index)}><TrashIcon className="text-red-500 w-6 h-6"/></button>
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
                            <input type="number" value={supplement?.additionalPrice || ''} onChange={e => updateSupplement(size, 'additionalPrice', e.target.value)} placeholder={`${t.additionalPrice} (€)`} className="p-2 border rounded-lg" />
                            <input type="number" step="15" value={supplement?.additionalDuration || ''} onChange={e => updateSupplement(size, 'additionalDuration', e.target.value)} placeholder={`${t.additionalDuration}`} className="p-2 border rounded-lg" />
                        </div>
                    )})}
                </div>
            </section>
            
            {/* Action Buttons */}
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
