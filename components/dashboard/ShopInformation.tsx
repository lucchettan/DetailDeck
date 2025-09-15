
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { CloseIcon, ImageIcon, PlusIcon, SaveIcon } from '../Icons';
import CustomSelect from '../CustomSelect';
import { Shop } from '../Dashboard';

type TimeFrame = { from: string; to: string };
type Schedule = {
  [key: string]: {
    isOpen: boolean;
    timeframes: TimeFrame[];
  };
};

const initialSchedule: Schedule = {
  monday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  tuesday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  wednesday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  thursday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  friday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  saturday: { isOpen: false, timeframes: [] },
  sunday: { isOpen: false, timeframes: [] },
};

const getInitialFormData = (shopData: Shop | null): Partial<Shop> => {
    return {
        businessType: 'local',
        minBookingNotice: '4h',
        maxBookingHorizon: '12w',
        acceptsOnSitePayment: false,
        bookingFee: '20',
        ...shopData,
        schedule: shopData?.schedule || initialSchedule,
    }
}

const TimePicker: React.FC<{ value: string, onChange: (value: string) => void }> = ({ value, onChange }) => {
  const timeOptions = useMemo(() => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        const timeValue = `${hh}:${mm}`;
        times.push({ value: timeValue, label: timeValue });
      }
    }
    return times;
  }, []);
  
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={timeOptions}
    />
  );
};

interface ShopInformationProps {
    shopData: Shop | null;
    onSave: (updatedData: any) => Promise<void>;
}

const ShopInformation: React.FC<ShopInformationProps> = ({ shopData, onSave }) => {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<Partial<Shop>>(getInitialFormData(shopData));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(getInitialFormData(shopData));
  }, [shopData]);


  const handleInputChange = (field: keyof Shop, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (day: string, field: 'isOpen' | 'timeframes', value: any) => {
    setFormData(prev => {
        const newSchedule = { ...(prev.schedule || initialSchedule) };
        
        let dayData = { ...newSchedule[day] };

        if (field === 'isOpen') {
          dayData.isOpen = value;
          // If toggling on from a closed state with no timeframes, add a default one.
          if (value && dayData.timeframes.length === 0) {
            dayData.timeframes = [{ from: '09:00', to: '17:00' }];
          }
        } else {
          dayData.timeframes = value;
        }

        newSchedule[day] = dayData;
        return { ...prev, schedule: newSchedule };
    });
  };

  const handleAddTimeFrame = (day: string) => {
    const currentFrames = formData.schedule?.[day]?.timeframes || [];
    handleScheduleChange(day, 'timeframes', [...currentFrames, { from: '14:00', to: '18:00' }]);
  };

  const handleRemoveTimeFrame = (day: string, index: number) => {
    const currentFrames = formData.schedule?.[day]?.timeframes || [];
    const newTimeframes = currentFrames.filter((_, i) => i !== index);
    handleScheduleChange(day, 'timeframes', newTimeframes);
    // If last timeframe is removed, set day to closed
    if (newTimeframes.length === 0) {
        handleScheduleChange(day, 'isOpen', false);
    }
  };

  const handleTimeChange = (day: string, index: number, field: 'from' | 'to', value: string) => {
    const currentFrames = formData.schedule?.[day]?.timeframes || [];
    const newTimeframes = [...currentFrames];
    newTimeframes[index] = { ...newTimeframes[index], [field]: value };
    handleScheduleChange(day, 'timeframes', newTimeframes);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleInputChange('shopImageUrl', event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    // Exclude properties that shouldn't be sent in the update payload, like id, owner_id etc.
    // Fix: Use camelCase 'ownerId' to match the 'Shop' type.
    const { id, ownerId, ...updateData } = formData;
    await onSave(updateData);
    setIsSaving(false);
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  const noticeOptions = [
    { value: '30m', label: t.notice_30_minutes }, { value: '1h', label: t.notice_1_hour },
    { value: '2h', label: t.notice_2_hours }, { value: '4h', label: t.notice_4_hours },
    { value: '8h', label: t.notice_8_hours }, { value: '12h', label: t.notice_12_hours },
    { value: '1d', label: t.notice_1_day }, { value: '2d', label: t.notice_2_days },
  ];
  
  const horizonOptions = [
    { value: '1w', label: t.horizon_1_week }, { value: '2w', label: t.horizon_2_weeks },
    { value: '4w', label: t.horizon_4_weeks }, { value: '8w', label: t.horizon_8_weeks },
    { value: '12w', label: t.horizon_12_weeks }, { value: '24w', label: t.horizon_24_weeks },
    { value: '52w', label: t.horizon_52_weeks },
  ];
  
  const bookingFeeOptions = Array.from({ length: 11 }, (_, i) => ({ value: (i * 5).toString(), label: `${i * 5}€` }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.shopInformation}</h2>
      <p className="text-brand-gray mb-6">{t.setupShopSubtitle}</p>
      
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold text-brand-dark mb-4 border-b pb-4">Business Details</h3>
         
         <div className="mt-6 mb-8">
            <label className="block text-sm font-bold text-brand-dark mb-2">{t.shopImage}</label>
             {formData.shopImageUrl ? (
                <div className="mt-2 relative group w-full max-w-xs h-40 rounded-lg overflow-hidden shadow-sm">
                    <img src={formData.shopImageUrl} alt={t.shopName} className="w-full h-full object-cover" />
                    <label htmlFor="shop-image-upload" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="text-white text-center">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                            <span className="font-semibold">{t.changeImage}</span>
                        </div>
                    </label>
                    <input id="shop-image-upload" name="shop-image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                </div>
            ) : (
                <label htmlFor="shop-image-upload" className="mt-2 relative flex justify-center w-full max-w-xs h-40 px-6 py-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-brand-blue group transition-colors">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 text-gray-400 group-hover:text-brand-blue transition-colors">
                        <ImageIcon className="h-10 w-10" />
                        <div className="flex items-center text-sm font-semibold text-brand-dark">
                            <PlusIcon className="w-5 h-5 mr-1" />
                            <span>{t.uploadImage}</span>
                        </div>
                    </div>
                    <input id="shop-image-upload" name="shop-image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                </label>
            )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label htmlFor="email" className="block text-sm font-bold text-brand-dark mb-2">{t.emailAddress}</label>
                <input type="email" id="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
            </div>
             <div>
                <label htmlFor="phone" className="block text-sm font-bold text-brand-dark mb-2">{t.phoneNumber}</label>
                <input type="tel" id="phone" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
            </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold text-brand-dark mb-2">{t.businessType}</label>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer flex-1">
              <input type="radio" name="businessType" value="local" checked={formData.businessType === 'local'} onChange={() => handleInputChange('businessType', 'local')} className="h-4 w-4 text-brand-blue"/>
              <span className="ml-3 font-medium text-brand-dark">{t.localBusiness}</span>
            </label>
            <label className="flex items-center p-4 border rounded-lg cursor-pointer flex-1">
              <input type="radio" name="businessType" value="mobile" checked={formData.businessType === 'mobile'} onChange={() => handleInputChange('businessType', 'mobile')} className="h-4 w-4 text-brand-blue"/>
              <span className="ml-3 font-medium text-brand-dark">{t.mobileBusiness}</span>
            </label>
          </div>
        </div>
        {formData.businessType === 'local' && (
          <div>
            <label htmlFor="address" className="block text-sm font-bold text-brand-dark mb-2">{t.address}</label>
            <input type="text" id="address" value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} placeholder={t.addressPlaceholder} className="w-full p-2 border border-gray-300 rounded-lg"/>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold text-brand-dark mb-4 border-b pb-4">{t.bookingPolicies}</h3>
        <p className="text-brand-gray mb-6 text-sm">{t.bookingPoliciesSubtitle}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <label htmlFor="minBookingNotice" className="block text-sm font-bold text-brand-dark">{t.minBookingNotice}</label>
                <p className="text-xs text-brand-gray mb-2">{t.minBookingNoticeSubtitle}</p>
                <select id="minBookingNotice" value={formData.minBookingNotice || '4h'} onChange={(e) => handleInputChange('minBookingNotice', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                    {noticeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="maxBookingHorizon" className="block text-sm font-bold text-brand-dark">{t.maxBookingHorizon}</label>
                <p className="text-xs text-brand-gray mb-2">{t.maxBookingHorizonSubtitle}</p>
                <select id="maxBookingHorizon" value={formData.maxBookingHorizon || '12w'} onChange={(e) => handleInputChange('maxBookingHorizon', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                    {horizonOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <div className="md:col-span-2 border-t pt-8">
                 <label className="block text-sm font-bold text-brand-dark mb-2">{t.onSitePayment}</label>
                 <label htmlFor="acceptsOnSitePayment" className="flex items-center mt-2 cursor-pointer">
                    <div className="relative">
                        <input id="acceptsOnSitePayment" type="checkbox" className="sr-only" checked={!!formData.acceptsOnSitePayment} onChange={(e) => handleInputChange('acceptsOnSitePayment', e.target.checked)} />
                        <div className={`block w-14 h-8 rounded-full transition ${formData.acceptsOnSitePayment ? 'bg-brand-blue' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.acceptsOnSitePayment ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <span className="ml-4 text-brand-gray">{t.acceptOnSitePayments}</span>
                 </label>
            </div>
            {formData.acceptsOnSitePayment && (
                 <div className="md:col-span-2">
                    <label htmlFor="bookingFee" className="block text-sm font-bold text-brand-dark">{t.bookingFee}</label>
                    <p className="text-xs text-brand-gray mb-2">{t.bookingFeeSubtitle}</p>
                    <select
                        id="bookingFee"
                        value={formData.bookingFee || '20'}
                        onChange={(e) => handleInputChange('bookingFee', e.target.value)}
                        className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg bg-white"
                    >
                        {bookingFeeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                 </div>
            )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-brand-dark mb-4 border-b pb-4">{t.businessHours}</h3>
        <p className="text-brand-gray mb-6 text-sm">{t.businessHoursSubtitle}</p>
        <div className="space-y-6">
          {daysOfWeek.map(day => (
            <div key={day} className={`grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b pb-6 last:border-b-0 p-4 rounded-lg transition-all duration-300 ${!formData.schedule?.[day]?.isOpen ? 'bg-gray-50 opacity-70' : ''}`}>
              <div className="font-semibold text-brand-dark flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={formData.schedule?.[day]?.isOpen || false} onChange={(e) => handleScheduleChange(day, 'isOpen', e.target.checked)} />
                    <div className={`block w-14 h-8 rounded-full transition ${formData.schedule?.[day]?.isOpen ? 'bg-brand-blue' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.schedule?.[day]?.isOpen ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="ml-4 capitalize">{t[`day_${day}`]}</span>
                </label>
              </div>
              <div className="md:col-span-2">
                {formData.schedule?.[day]?.isOpen ? (
                    <div className="space-y-3">
                        {(formData.schedule?.[day]?.timeframes || []).map((frame, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-sm text-brand-gray">{t.from}</span>
                                <div className="flex-1"><TimePicker value={frame.from} onChange={value => handleTimeChange(day, index, 'from', value)} /></div>
                                <span className="text-sm text-brand-gray">{t.to}</span>
                                <div className="flex-1"><TimePicker value={frame.to} onChange={value => handleTimeChange(day, index, 'to', value)} /></div>
                                {(formData.schedule?.[day]?.timeframes.length ?? 0) > 0 && 
                                    <button onClick={() => handleRemoveTimeFrame(day, index)} className="text-gray-400 hover:text-red-500"><CloseIcon/></button>
                                }
                            </div>
                        ))}
                        <button onClick={() => handleAddTimeFrame(day)} className="text-sm text-brand-blue font-semibold hover:underline">+ {t.addTimeframe}</button>
                    </div>
                ) : <p className="text-brand-gray font-medium h-10 flex items-center">{t.closed}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button onClick={handleSaveClick} disabled={isSaving} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-75">
            <SaveIcon className="w-5 h-5" />
            {isSaving ? 'Saving...' : t.saveChanges}
        </button>
      </div>
    </div>
  );
};

export default ShopInformation;