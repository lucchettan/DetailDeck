import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon, MoneyIcon, HourglassIcon, ImageIcon, PlusIcon, TrashIcon, SaveIcon } from '../Icons';
import { Service, AddOn } from '../Dashboard';
import CustomSelect from '../CustomSelect';
// FIX: Import 'formatDuration' to resolve usage error.
import { formatDuration } from '../../lib/utils';

interface ServiceEditorProps {
  service: Service | null;
  shopAddOns: AddOn[];
  onBack: () => void;
  onSave: (
    service: Omit<Service, 'id'> & { id?: string },
    specificAddOns: (Omit<AddOn, 'shopId'> & { id?: string })[],
    deletedAddOnIds: string[]
  ) => Promise<boolean | void>;
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
    imageUrl: '',
  };
};

const DurationPicker: React.FC<{value?: string, onChange: (value: string) => void, disabled?: boolean, className?: string}> = ({ value, onChange, disabled }) => {
    const options = useMemo(() => {
        const opts = [];
        for (let minutes = 15; minutes <= 360; minutes += 15) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            let label = '';
            if (h > 0) label += `${h}h`;
            if (m > 0) {
                if (h > 0) label += ' ';
                label += `${m}min`;
            }
            opts.push({ value: minutes.toString(), label: label || '0' });
        }
        return opts;
    }, []);

    return (
        <CustomSelect
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            options={options}
            icon={<HourglassIcon className="h-5 w-5" />}
        />
    );
}

const ServiceEditor: React.FC<ServiceEditorProps> = ({ service, shopAddOns, onBack, onSave, onDelete }) => {
  const { t } = useLanguage();
  const isEditing = service !== null;
  const [formData, setFormData] = useState(getInitialFormData(service));
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [specificAddOns, setSpecificAddOns] = useState<(Omit<AddOn, 'shopId'> & { id?: string })[]>([]);
  const [deletedAddOnIds, setDeletedAddOnIds] = useState<string[]>([]);
  const [newAddOn, setNewAddOn] = useState({ name: '', price: '10', duration: '15' });

  useEffect(() => {
    setFormData(getInitialFormData(service));
    if (service) {
        setSpecificAddOns(shopAddOns.filter(a => a.serviceId === service.id));
    } else {
        setSpecificAddOns([]);
    }
    setDeletedAddOnIds([]);
    setErrors({});
  }, [service, shopAddOns]);
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = t.fieldIsRequired;
    }
    if (!formData.varies) {
      if (!formData.singlePrice?.price) {
        newErrors.singlePrice = t.priceIsRequired;
      }
      if (!formData.singlePrice?.duration) {
        newErrors.singleDuration = t.durationIsRequired;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({ ...prev, [name]: checked !== undefined ? checked : value }));
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
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
     if (field === 'price' && errors.singlePrice) {
        setErrors(prev => ({...prev, singlePrice: ''}));
    }
     if (field === 'duration' && errors.singleDuration) {
        setErrors(prev => ({...prev, singleDuration: ''}));
    }
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
  
  const handleAddSpecificAddOn = () => {
    if (!newAddOn.name.trim()) return;
    const newAddOnWithTempId = {
      ...newAddOn,
      id: `temp-${Date.now()}`,
      serviceId: service?.id || null,
    };
    setSpecificAddOns(prev => [...prev, newAddOnWithTempId]);
    setNewAddOn({ name: '', price: '10', duration: '15' });
  };

  const handleDeleteSpecificAddOn = (addOnId: string) => {
    if (!addOnId.startsWith('temp-')) {
        setDeletedAddOnIds(prev => [...prev, addOnId]);
    }
    setSpecificAddOns(prev => prev.filter(a => a.id !== addOnId));
  };
  
  const handleDelete = () => {
    if (service && window.confirm(t.deleteServiceConfirmation)) {
      onDelete(service.id);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    const success = await onSave(formData, specificAddOns, deletedAddOnIds);
    setIsSaving(false);

    if (success && !isEditing) {
      alert(t.serviceCreatedSuccess);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark">{isEditing ? t.editService : t.addNewService}</h2>
          </div>
          <button type="button" onClick={onBack} className="text-brand-gray hover:text-brand-dark">&larr; {t.catalog}</button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSave} noValidate>
            <div className="mb-8">
                <label className="block text-sm font-bold text-brand-dark mb-2">{t.serviceImage}</label>
                
                {formData.imageUrl ? (
                    <div className="mt-2 relative group w-full max-w-sm h-48 rounded-lg overflow-hidden shadow-sm">
                        <img src={formData.imageUrl} alt={t.serviceName} className="w-full h-full object-cover" />
                        <label htmlFor="file-upload" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <div className="text-white text-center">
                                <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                <span className="font-semibold">{t.changeImage}</span>
                            </div>
                        </label>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                    </div>
                ) : (
                    <label htmlFor="file-upload" className="mt-2 relative flex justify-center w-full h-32 px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-brand-blue group transition-colors">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 text-gray-400 group-hover:text-brand-blue transition-colors">
                            <ImageIcon className="h-10 w-10" />
                            <div className="flex items-center text-sm font-semibold text-brand-dark">
                                <PlusIcon className="w-5 h-5 mr-1" />
                                <span>{t.uploadImage}</span>
                            </div>
                        </div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                    </label>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceName}</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={t.serviceNamePlaceholder} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" required />
                 {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceStatus}</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border border-gray-300 shadow-sm rounded-lg bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue">
                  <option value="active">{t.active}</option>
                  <option value="inactive">{t.inactive}</option>
                </select>
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-bold text-brand-dark mb-1">{t.serviceDescription}</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder={t.serviceDescriptionPlaceholder} rows={4} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"></textarea>
            </div>
            
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
                                    <input type="number" placeholder={t.price} value={formData.pricing[size]?.price || ''} onChange={(e) => handlePricingChange(size, 'price', e.target.value)} disabled={!formData.pricing[size]?.enabled} className="w-full p-2 pl-10 border bg-white border-gray-300 shadow-sm rounded-lg disabled:bg-gray-100 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" />
                                </div>
                                <div className="relative">
                                    <DurationPicker value={formData.pricing[size]?.duration} onChange={(value) => handlePricingChange(size, 'duration', value)} disabled={!formData.pricing[size]?.enabled} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 max-w-sm">
                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MoneyIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="number" placeholder={t.price} value={formData.singlePrice?.price || ''} onChange={(e) => handleSinglePriceChange('price', e.target.value)} className="w-full p-2 pl-10 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" />
                            </div>
                            {errors.singlePrice && <p className="text-red-500 text-xs mt-1">{errors.singlePrice}</p>}
                        </div>
                         <div>
                            <div className="relative">
                                <DurationPicker value={formData.singlePrice?.duration} onChange={(value) => handleSinglePriceChange('duration', value)} />
                            </div>
                            {errors.singleDuration && <p className="text-red-500 text-xs mt-1">{errors.singleDuration}</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t pt-6 mb-8">
                <h3 className="text-lg font-bold text-brand-dark mb-2">{t.specificAddOns}</h3>
                <p className="text-brand-gray text-sm mb-4">{t.specificAddOnsSubtitle}</p>
                <div className="space-y-4">
                    {specificAddOns.map((addOn) => (
                        <div key={addOn.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                            <div className="md:col-span-2 font-semibold">
                                {addOn.name}
                            </div>
                            <div className="font-semibold">
                                €{addOn.price}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">{formatDuration(parseInt(addOn.duration))}</span>
                                <button type="button" onClick={() => handleDeleteSpecificAddOn(addOn.id!)} className="text-gray-400 hover:text-red-500">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    {/* Add New Specific Addon Form */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-4 border-t">
                          <div className="md:col-span-2">
                              <input type="text" placeholder={t.addOnName} value={newAddOn.name} onChange={(e) => setNewAddOn(p => ({...p, name: e.target.value}))} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" />
                          </div>
                          <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MoneyIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <input type="number" placeholder={t.price} value={newAddOn.price} onChange={(e) => setNewAddOn(p => ({...p, price: e.target.value}))} className="w-full p-2 pl-10 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" />
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="flex-1">
                                  <DurationPicker value={newAddOn.duration} onChange={(value) => setNewAddOn(p => ({...p, duration: value}))} />
                              </div>
                              <button type="button" onClick={handleAddSpecificAddOn} className="bg-blue-100 text-brand-blue hover:bg-blue-200 p-2 rounded-lg">
                                  <PlusIcon className="w-5 h-5"/>
                              </button>
                          </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-8 border-t flex justify-end">
              <button type="button" onClick={onBack} className="bg-gray-200 text-brand-dark font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors mr-4">
                {t.cancel}
              </button>
              <button type="submit" disabled={isSaving} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-75 min-w-[150px]">
                {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                    <>
                        <SaveIcon className="w-5 h-5" />
                        <span>{isEditing ? t.saveChanges : t.createService}</span>
                    </>
                )}
              </button>
            </div>
          </form>

          {isEditing && (
            <div className="mt-8 border-t pt-6">
              <div className="bg-red-50 p-4 rounded-lg flex flex-col text-center md:flex-row md:text-left md:justify-between md:items-center">
                  <p className="text-red-800 text-sm max-w-md mb-4 md:mb-0">{t.deleteServiceConfirmation}</p>
                  <button type="button" onClick={handleDelete} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex-shrink-0 flex items-center justify-center gap-2">
                      <TrashIcon className="w-5 h-5" />
                      <span>{t.deleteService}</span>
                  </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default ServiceEditor;