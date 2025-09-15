
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon, MoneyIcon, HourglassIcon, ImageIcon } from '../Icons';
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
    varies: false,
    pricing: {
      S: { price: '150', duration: '120', enabled: true },
      M: { price: '180', duration: '150', enabled: true },
      L: { price: '', duration: '', enabled: false },
      XL: { price: '', duration: '', enabled: false },
    },
    singlePrice: { price: '120', duration: '90' },
    addOns: [],
    imageUrl: '',
  };
};

const DurationPicker: React.FC<{value?: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean, className?: string}> = ({ value, onChange, disabled, className }) => {
    const options = [];
    for (let minutes = 15; minutes <= 360; minutes += 15) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        let label = '';
        if (h > 0) label += `${h}h`;
        if (m > 0) {
            if (h > 0) label += ' ';
            label += `${m}min`;
        }
        options.push({ value: minutes.toString(), label: label || '0' });
    }
    return (
        <select value={value} onChange={onChange} disabled={disabled} className={className}>
            <option value="">--</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    );
}

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAddOn = () => {
    setFormData(prev => ({ ...prev, addOns: [...prev.addOns, { id: Date.now(), name: '', price: '', duration: '' }] }));
  };
  
  const handleRemoveAddOn = (id: number) => {
    setFormData(prev => ({ ...prev, addOns: prev.addOns.filter(addOn => addOn.id !== id) }));
  };
  
  const handleAddOnChange = (id: number, field: 'name' | 'price' | 'duration', value: string) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.map(addOn => 
        addOn.id === id ? { ...addOn, [field]: value } : addOn
      )
    }));
  };


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
        {/* Image Upload */}
        <div className="mb-8">
            <label className="block text-sm font-bold text-brand-dark mb-2">{t.serviceImage} (Optional)</label>
            <div className="mt-1 flex items-center">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt={t.serviceName} className="w-full h-full object-cover"/>
                    ) : (
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                    )}
                </div>
                <label htmlFor="file-upload" className="cursor-pointer ml-5 bg-white py-2 px-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-brand-dark hover:bg-gray-50 transition">
                    <span>{formData.imageUrl ? t.changeImage : t.uploadImage}</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                </label>
            </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceName}</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={t.serviceNamePlaceholder} className="w-full p-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceStatus}</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
              <option value="active">{t.active}</option>
              <option value="inactive">{t.inactive}</option>
            </select>
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceDescription}</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder={t.serviceDescriptionPlaceholder} rows={4} className="w-full p-2 border border-gray-300 rounded-lg"></textarea>
        </div>
        
        {/* Pricing */}
        <div className="border-t pt-6 mb-8">
            <h3 className="text-lg font-bold text-brand-dark mb-4">{t.pricingAndDuration}</h3>
            <div className="flex items-center mb-4">
                 <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded text-brand-blue border-gray-300 focus:ring-brand-blue" checked={formData.varies} onChange={() => setFormData({...formData, varies: !formData.varies})} />
                    <span className="ml-3 font-semibold text-brand-dark">{t.priceDurationVaries}</span>
                </label>
            </div>
            {formData.varies ? (
                <div className="space-y-4">
                    {vehicleSizes.map(size => (
                        <div key={size} className={`grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-4 rounded-lg transition-all ${!formData.pricing[size]?.enabled ? 'bg-gray-50 opacity-60' : ''}`}>
                            <label className="font-semibold text-sm flex items-center cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={!!formData.pricing[size]?.enabled} onChange={() => toggleSizeEnabled(size)} />
                                    <div className={`block w-12 h-7 rounded-full transition ${formData.pricing[size]?.enabled ? 'bg-brand-blue' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.pricing[size]?.enabled ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                               <span className="ml-4">{t[`size_${size}`]}</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MoneyIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="number" placeholder={t.price} value={formData.pricing[size]?.price || ''} onChange={(e) => handlePricingChange(size, 'price', e.target.value)} disabled={!formData.pricing[size]?.enabled} className="w-full p-2 pl-10 border border-gray-300 rounded-lg disabled:bg-gray-100" />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <HourglassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <DurationPicker value={formData.pricing[size]?.duration} onChange={(e) => handlePricingChange(size, 'duration', e.target.value)} disabled={!formData.pricing[size]?.enabled} className="w-full p-2 pl-10 border border-gray-300 rounded-lg disabled:bg-gray-100 bg-white" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MoneyIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="number" placeholder={t.price} value={formData.singlePrice?.price || ''} onChange={(e) => handleSinglePriceChange('price', e.target.value)} className="w-full p-2 pl-10 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HourglassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <DurationPicker value={formData.singlePrice?.duration} onChange={(e) => handleSinglePriceChange('duration', e.target.value)} className="w-full p-2 pl-10 border border-gray-300 rounded-lg bg-white" />
                    </div>
                </div>
            )}
        </div>

        {/* Add-ons */}
        <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-brand-dark mb-2">{t.addOns}</h3>
            <p className="text-brand-gray text-sm mb-4">{t.addOnsSubtitle}</p>
            <div className="space-y-4">
            {formData.addOns.map((addOn, index) => (
                <div key={addOn.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-2">
                        <input
                        type="text"
                        placeholder={t.addOnName}
                        value={addOn.name}
                        onChange={(e) => handleAddOnChange(addOn.id, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MoneyIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                        type="number"
                        placeholder={t.price}
                        value={addOn.price}
                        onChange={(e) => handleAddOnChange(addOn.id, 'price', e.target.value)}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <HourglassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <DurationPicker
                                value={addOn.duration}
                                onChange={(e) => handleAddOnChange(addOn.id, 'duration', e.target.value)}
                                className="w-full p-2 pl-10 border border-gray-300 rounded-lg bg-white"
                            />
                        </div>
                        <button type="button" onClick={() => handleRemoveAddOn(addOn.id)} className="text-gray-400 hover:text-red-500">
                            <CloseIcon />
                        </button>
                    </div>
                </div>
            ))}
            </div>
            <button type="button" onClick={handleAddOn} className="mt-4 text-sm font-semibold text-brand-blue hover:underline">
            + {t.newAddOn}
            </button>
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
