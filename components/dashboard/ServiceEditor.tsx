
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon } from '../Icons';
import { Service } from '../Dashboard';

interface ServiceEditorProps {
  service: Service | null;
  onBack: () => void;
  onSave: (service: Omit<Service, 'id'> & { id?: string }) => void;
  onDelete: (serviceId: string) => void;
}

const vehicleSizes = ['S', 'M', 'L', 'XL'] as const;

const getInitialFormData = (service: Service | null): Omit<Service, 'id'> & { id?: string } => {
  if (service) return { ...service };

  return {
    name: '',
    description: '',
    status: 'active',
    varies: true,
    pricing: {
      S: { price: '', duration: '', enabled: true },
      M: { price: '', duration: '', enabled: true },
      L: { price: '', duration: '', enabled: false },
      XL: { price: '', duration: '', enabled: false },
    },
    singlePrice: { price: '', duration: '' },
    addOns: [],
  };
};

const ServiceEditor: React.FC<ServiceEditorProps> = ({ service, onBack, onSave, onDelete }) => {
  const { t } = useLanguage();
  const isEditing = service !== null;
  const [formData, setFormData] = useState(getInitialFormData(service));

  useEffect(() => {
    setFormData(getInitialFormData(service));
  }, [service]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({ ...prev, [name]: checked !== undefined ? checked : value }));
  };

  const handlePricingChange = (size: 'S'|'M'|'L'|'XL', field: 'price'|'duration', value: string) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [size]: { ...prev.pricing[size], [field]: value }
      }
    }));
  }
  
  const toggleSizeEnabled = (size: 'S'|'M'|'L'|'XL') => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [size]: { ...prev.pricing[size], enabled: !prev.pricing[size]?.enabled }
      }
    }));
  }

  const handleSinglePriceChange = (field: 'price'|'duration', value: string) => {
    setFormData(prev => ({ ...prev, singlePrice: { ...prev.singlePrice, [field]: value } }));
  }

  const handleAddOnChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newAddOns = [...formData.addOns];
    newAddOns[index] = {...newAddOns[index], [name]: value};
    setFormData(prev => ({...prev, addOns: newAddOns}));
  }

  const addNewAddOn = () => {
      setFormData(prev => ({...prev, addOns: [...prev.addOns, {id: Date.now(), name: '', price: '', duration: ''}]}));
  }

  const removeAddOn = (index: number) => {
    setFormData(prev => ({...prev, addOns: prev.addOns.filter((_, i) => i !== index)}));
  }
  
  const handleDelete = () => {
    if (service && window.confirm(t.deleteServiceConfirmation)) {
      onDelete(service.id);
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form onSubmit={handleSave}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">{isEditing ? t.editService : t.addNewService}</h2>
        </div>
        <button type="button" onClick={onBack} className="text-brand-gray hover:text-brand-dark">&larr; {t.catalog}</button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceName}</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={t.serviceNamePlaceholder} className="w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceStatus}</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md bg-white">
              <option value="active">{t.active}</option>
              <option value="inactive">{t.inactive}</option>
            </select>
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceDescription}</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder={t.serviceDescriptionPlaceholder} rows={4} className="w-full p-2 border border-gray-300 rounded-md"></textarea>
        </div>
        
        {/* Pricing */}
        <div className="border-t pt-6 mb-8">
            <h3 className="text-lg font-bold text-brand-dark mb-4">{t.pricingAndDuration}</h3>
            <div className="flex items-center mb-4">
                 <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={formData.varies} onChange={() => setFormData({...formData, varies: !formData.varies})} />
                    <div className={`block w-14 h-8 rounded-full transition ${formData.varies ? 'bg-brand-blue' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.varies ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="ml-4 font-semibold text-brand-dark">{t.priceDurationVaries}</span>
                </label>
            </div>
            {formData.varies ? (
                <div className="space-y-4">
                    {vehicleSizes.map(size => (
                        <div key={size} className={`grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-2 rounded-md transition-opacity ${formData.pricing[size]?.enabled ? 'opacity-100' : 'opacity-50 bg-gray-50'}`}>
                            <label className="font-semibold text-sm flex items-center">
                               <input type="checkbox" checked={!!formData.pricing[size]?.enabled} onChange={() => toggleSizeEnabled(size)} className="h-4 w-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue mr-3"/>
                               {t[`size_${size}`]}
                            </label>
                            <input type="number" placeholder={t.price} value={formData.pricing[size]?.price || ''} onChange={(e) => handlePricingChange(size, 'price', e.target.value)} disabled={!formData.pricing[size]?.enabled} className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                            <input type="number" placeholder={t.duration} value={formData.pricing[size]?.duration || ''} onChange={(e) => handlePricingChange(size, 'duration', e.target.value)} disabled={!formData.pricing[size]?.enabled} className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <input type="number" placeholder={t.price} value={formData.singlePrice?.price || ''} onChange={(e) => handleSinglePriceChange('price', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                    <input type="number" placeholder={t.duration} value={formData.singlePrice?.duration || ''} onChange={(e) => handleSinglePriceChange('duration', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
            )}
        </div>
        
        {/* Add-ons */}
        <div className="border-t pt-6 mb-8">
            <h3 className="text-lg font-bold text-brand-dark mb-1">{t.addOns}</h3>
            <p className="text-brand-gray text-sm mb-4">{t.addOnsSubtitle}</p>
            <div className="space-y-4">
                {formData.addOns.map((addOn, index) => (
                     <div key={addOn.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <input type="text" name="name" value={addOn.name} onChange={e => handleAddOnChange(index, e)} placeholder={t.addOnName} className="md:col-span-2 w-full p-2 border border-gray-300 rounded-md" />
                        <input type="number" name="price" value={addOn.price} onChange={e => handleAddOnChange(index, e)} placeholder={t.price} className="w-full p-2 border border-gray-300 rounded-md" />
                        <div className="flex items-center gap-2">
                             <input type="number" name="duration" value={addOn.duration} onChange={e => handleAddOnChange(index, e)} placeholder={t.duration} className="w-full p-2 border border-gray-300 rounded-md" />
                             <button type="button" onClick={() => removeAddOn(index)} className="text-gray-400 hover:text-red-500"><CloseIcon/></button>
                        </div>
                     </div>
                ))}
            </div>
             <button type="button" onClick={addNewAddOn} className="mt-4 text-sm text-brand-blue font-semibold hover:underline">+ {t.newAddOn}</button>
        </div>

        <div className="mt-8 flex justify-end">
          <button type="button" onClick={onBack} className="bg-gray-200 text-brand-dark font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors mr-4">
            {t.cancel}
          </button>
          <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">
            {isEditing ? t.saveChanges : t.createService}
          </button>
        </div>
      </div>
      
      {isEditing && (
        <div className="mt-10 border-t-2 border-red-300 pt-6">
            <h3 className="text-lg font-bold text-red-700">{t.dangerZone}</h3>
            <div className="mt-4 bg-red-50 p-4 rounded-lg flex justify-between items-center">
                <p className="text-red-800 text-sm max-w-md">{t.deleteServiceConfirmation}</p>
                <button type="button" onClick={handleDelete} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex-shrink-0">
                    {t.deleteService}
                </button>
            </div>
        </div>
      )}

    </form>
  );
};

export default ServiceEditor;
