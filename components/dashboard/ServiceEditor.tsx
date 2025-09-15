
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon } from '../Icons';

interface ServiceEditorProps {
  serviceId: string | null;
  onBack: () => void;
}

// FIX: Use 'as const' to create a readonly tuple with literal types.
// This helps TypeScript infer a more specific type for `size` in the map function,
// which resolves the issue of `t[...]` being inferred as a broad, un-renderable type.
const vehicleSizes = ['S', 'M', 'L', 'XL'] as const;

const ServiceEditor: React.FC<ServiceEditorProps> = ({ serviceId, onBack }) => {
  const { t } = useLanguage();
  const isEditing = serviceId !== null;

  // Mock data fetching for editing
  // In a real app, this would be a `useEffect` hook fetching from the backend
  const initialData = isEditing ? {
    name: 'Premium Interior Cleaning',
    description: 'Deep clean of all interior surfaces, including shampooing carpets and leather conditioning.',
    status: 'active',
    varies: true,
    pricing: {
        S: { price: '150', duration: '120' },
        M: { price: '180', duration: '150' },
        L: { price: '210', duration: '180' },
        XL: { price: '240', duration: '210' },
    },
    singlePrice: { price: '', duration: '' },
    addOns: [ {id: 1, name: 'Ozone Treatment', price: '50', duration: '30'} ]
  } : {
    name: '', description: '', status: 'active', varies: false,
    pricing: { S: {}, M: {}, L: {}, XL: {} },
    singlePrice: { price: '', duration: '' },
    addOns: []
  };

  const [formData, setFormData] = useState(initialData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOnchange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (window.confirm(t.deleteServiceConfirmation)) {
      console.log("Deleting service...");
      onBack();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">{isEditing ? t.editService : t.createService}</h2>
        </div>
        <button onClick={onBack} className="text-brand-gray hover:text-brand-dark">&larr; {t.catalog}</button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceName}</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={t.serviceNamePlaceholder} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceStatus}</label>
            <select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md bg-white">
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
                        <div key={size} className="grid grid-cols-3 gap-4 items-center">
                            <label className="font-semibold text-sm">{t[`size_${size}`]}</label>
                            <input type="number" placeholder={t.price} className="w-full p-2 border border-gray-300 rounded-md" />
                            <input type="number" placeholder={t.duration} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder={t.price} className="w-full p-2 border border-gray-300 rounded-md" />
                    <input type="number" placeholder={t.duration} className="w-full p-2 border border-gray-300 rounded-md" />
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
                        <input type="text" name="name" value={addOn.name} onChange={e => handleAddOnchange(index, e)} placeholder={t.addOnName} className="md:col-span-2 w-full p-2 border border-gray-300 rounded-md" />
                        <input type="number" name="price" value={addOn.price} onChange={e => handleAddOnchange(index, e)} placeholder={t.price} className="w-full p-2 border border-gray-300 rounded-md" />
                        <div className="flex items-center gap-2">
                             <input type="number" name="duration" value={addOn.duration} onChange={e => handleAddOnchange(index, e)} placeholder={t.duration} className="w-full p-2 border border-gray-300 rounded-md" />
                             <button onClick={() => removeAddOn(index)} className="text-gray-400 hover:text-red-500"><CloseIcon/></button>
                        </div>
                     </div>
                ))}
            </div>
             <button onClick={addNewAddOn} className="mt-4 text-sm text-brand-blue font-semibold hover:underline">+ {t.newAddOn}</button>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={onBack} className="bg-gray-200 text-brand-dark font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors mr-4">
            {t.cancel}
          </button>
          <button className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">
            {isEditing ? t.saveChanges : t.createService}
          </button>
        </div>
      </div>
      
      {isEditing && (
        <div className="mt-10 border-t-2 border-red-300 pt-6">
            <h3 className="text-lg font-bold text-red-700">{t.dangerZone}</h3>
            <div className="mt-4 bg-red-50 p-4 rounded-lg flex justify-between items-center">
                <p className="text-red-800 text-sm">{t.deleteServiceConfirmation}</p>
                <button onClick={handleDelete} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                    {t.deleteService}
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default ServiceEditor;
