import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { CloseIcon, ImageIcon, PlusIcon, SaveIcon, StorefrontIcon, ClockIcon, GavelIcon, UserCircleIcon, KeyIcon, BuildingOffice2Icon, TruckIcon } from '../Icons';
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

interface SettingsProps {
    shopData: Shop | null;
    onSave: (updatedData: any) => Promise<void>;
    initialStep?: number;
}

const Settings: React.FC<SettingsProps> = ({ shopData, onSave, initialStep }) => {
  const { t } = useLanguage();
  const { updateUserPassword } = useAuth();
  const [activeStep, setActiveStep] = useState<number>(initialStep || 1);
  
  const [formData, setFormData] = useState<Partial<Shop>>(getInitialFormData(shopData));
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState('20');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
      if (initialStep) {
          setActiveStep(initialStep);
      }
  }, [initialStep]);

  useEffect(() => {
    setFormData(getInitialFormData(shopData));
    setCity(shopData?.serviceAreas?.[0]?.city || '');
    setRadius(String(shopData?.serviceAreas?.[0]?.radius || '20'));
    setIsDirty(false);
  }, [shopData]);
  
  useEffect(() => {
    const initialData = getInitialFormData(shopData);
    const initialCity = shopData?.serviceAreas?.[0]?.city || '';
    const initialRadius = String(shopData?.serviceAreas?.[0]?.radius || '20');

    const formDataChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    const cityChanged = city !== initialCity;
    const radiusChanged = radius !== initialRadius;

    setIsDirty(formDataChanged || cityChanged || radiusChanged);
  }, [formData, city, radius, shopData]);


  const steps = useMemo(() => [
    { id: 1, label: t.tabShopDetails, icon: <StorefrontIcon />, isComplete: (data: Partial<Shop>) => !!data.name && !!data.email && !!data.phone },
    { id: 2, label: t.tabAvailability, icon: <ClockIcon />, isComplete: (data: Partial<Shop>) => !!data.schedule },
    { id: 3, label: t.tabPolicies, icon: <GavelIcon />, isComplete: (data: Partial<Shop>) => !!data.minBookingNotice },
    { id: 4, label: t.tabAccount, icon: <UserCircleIcon />, isComplete: () => true },
  ], [t]);


  const handleInputChange = (field: keyof Shop, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (day: string, field: 'isOpen' | 'timeframes', value: any) => {
    setFormData(prev => {
        const newSchedule = { ...(prev.schedule || initialSchedule) };
        let dayData = { ...newSchedule[day] };

        if (field === 'isOpen') {
          dayData.isOpen = value;
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
    const { id, ownerId, ...updateData } = formData;
    
    if (updateData.businessType === 'mobile') {
        updateData.serviceAreas = city ? [{ city, radius: parseInt(radius, 10) }] : [];
        updateData.address = undefined;
    } else {
        updateData.serviceAreas = [];
    }

    await onSave(updateData);
    setIsSaving(false);
  };
    
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (password.length < 6) {
        setPasswordError(t.passwordTooShort);
        return;
    }
    if (password !== confirmPassword) {
        setPasswordError(t.passwordMismatch);
        return;
    }

    setIsUpdatingPassword(true);
    const { error } = await updateUserPassword(password);
    if (error) {
        setPasswordError(error.message);
    } else {
        setPasswordSuccess(t.passwordUpdatedSuccess);
        setPassword('');
        setConfirmPassword('');
    }
    setIsUpdatingPassword(false);
  };

  const radiusOptions = [
    { value: '5', label: '5 km' }, { value: '10', label: '10 km' },
    { value: '15', label: '15 km' }, { value: '20', label: '20 km' },
    { value: '30', label: '30 km' }, { value: '50', label: '50 km' },
    { value: '100', label: '100 km' },
  ];

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
  
  const TopSaveButton = () => (
    <button 
        type="button"
        onClick={handleSaveClick}
        disabled={!isDirty || isSaving}
        className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {isSaving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        ) : (
            <>
                <SaveIcon className="w-5 h-5" />
                <span>{t.saveModifications}</span>
            </>
        )}
    </button>
  );


  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.settings}</h2>
      <p className="text-brand-gray mb-6">{t.settingsSubtitle}</p>
      
      {/* Tabs as Buttons */}
      <div className="flex items-center gap-4 w-full mb-8 flex-wrap">
        {steps.map((step) => {
            const isCompleted = step.isComplete(formData);
            const isCurrent = activeStep === step.id;
            return (
                <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isCurrent
                        ? 'bg-blue-50 border-brand-blue shadow-md'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                        isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                        {React.cloneElement(step.icon, {
                            className: `w-5 h-5 ${isCompleted ? 'text-brand-blue' : 'text-gray-500'}`
                        })}
                    </div>
                    <div>
                        <p className={`font-semibold transition-colors ${isCurrent ? 'text-brand-blue' : 'text-brand-dark'}`}>
                            {step.label}
                        </p>
                    </div>
                </button>
            )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        {activeStep === 1 && (
          <div>
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3"><StorefrontIcon className="w-6 h-6 text-brand-blue" /> {t.businessDetails}</h3>
              <TopSaveButton />
            </div>
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
                  <label htmlFor="shopName" className="block text-sm font-bold text-brand-dark mb-2">{t.shopName}</label>
                  <input type="text" id="shopName" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full p-2 border bg-white border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                  <label htmlFor="email" className="block text-sm font-bold text-brand-dark mb-2">{t.emailAddress}</label>
                  <input type="email" id="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full p-2 border bg-white border-gray-300 rounded-lg" />
              </div>
              <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-brand-dark mb-2">{t.phoneNumber}</label>
                  <input type="tel" id="phone" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full p-2 border bg-white border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-brand-dark mb-4">{t.businessType}</label>
              <div className="space-y-4">
                  <div className={`p-4 border-2 rounded-lg transition-all ${formData.businessType === 'local' ? 'border-brand-blue bg-blue-50' : 'bg-white'}`}>
                      <button type="button" onClick={() => handleInputChange('businessType', 'local')} className="w-full flex items-center text-left">
                        <BuildingOffice2Icon className="w-8 h-8 mr-4 text-brand-blue" />
                        <div>
                            <p className="font-bold text-brand-dark">{t.localBusiness}</p>
                        </div>
                      </button>
                      {formData.businessType === 'local' && (
                        <div className="mt-4 pt-4 border-t">
                            <label htmlFor="address" className="block text-sm font-bold text-brand-dark mb-2">{t.address}</label>
                            <input type="text" id="address" value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} placeholder={t.addressPlaceholder} className="w-full p-2 border bg-white border-gray-300 rounded-lg"/>
                        </div>
                      )}
                  </div>
                  <div className={`p-4 border-2 rounded-lg transition-all ${formData.businessType === 'mobile' ? 'border-brand-blue bg-blue-50' : 'bg-white'}`}>
                       <button type="button" onClick={() => handleInputChange('businessType', 'mobile')} className="w-full flex items-center text-left">
                        <TruckIcon className="w-8 h-8 mr-4 text-brand-blue" />
                        <div>
                            <p className="font-bold text-brand-dark">{t.mobileBusiness}</p>
                        </div>
                      </button>
                      {formData.businessType === 'mobile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t items-end">
                            <div>
                            <label htmlFor="city" className="block text-sm font-bold text-brand-dark mb-2">{t.operatingCity}</label>
                            <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.cityPlaceholder} className="w-full p-2 border bg-white border-gray-300 rounded-lg"/>
                            </div>
                            <div>
                            <label className="block text-sm font-bold text-brand-dark">{t.serviceRadius}</label>
                            <p className="text-xs text-brand-gray mb-2">{t.serviceRadiusSubtitle}</p>
                            <CustomSelect
                                value={radius}
                                onChange={setRadius}
                                options={radiusOptions}
                            />
                            </div>
                        </div>
                      )}
                  </div>
              </div>
            </div>
          </div>
        )}
        
        {activeStep === 2 && (
          <div>
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3"><ClockIcon className="w-6 h-6 text-brand-blue" /> {t.businessHours}</h3>
              <TopSaveButton />
            </div>
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
        )}
        
        {activeStep === 3 && (
          <div>
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3"><GavelIcon className="w-6 h-6 text-brand-blue" /> {t.bookingPolicies}</h3>
              <TopSaveButton />
            </div>
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
        )}

        {activeStep === 4 && (
            <div>
                <h3 className="text-xl font-bold text-brand-dark mb-1 border-b pb-4 flex items-center gap-3"><KeyIcon className="w-6 h-6 text-brand-blue" /> {t.passwordManagement}</h3>
                <p className="text-brand-gray text-sm mt-4 mb-6">{t.passwordManagementSubtitle}</p>
                <form onSubmit={handlePasswordUpdate} className="max-w-md space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-brand-dark mb-1">{t.newPassword}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border bg-white border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-brand-dark mb-1">{t.confirmNewPassword}</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border bg-white border-gray-300 rounded-lg" required />
                    </div>
                    {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-600 text-sm">{passwordSuccess}</p>}
                    <div>
                        <button type="submit" disabled={isUpdatingPassword} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-75">
                            {isUpdatingPassword ? '...' : t.updatePassword}
                        </button>
                    </div>
                </form>
            </div>
        )}
      </div>
      
      {activeStep < 4 && (
        <div className="mt-8 flex justify-end">
            <button 
                onClick={handleSaveClick} 
                disabled={!isDirty || isSaving}
                className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px]"
            >
                {isSaving ? (
                     <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                    <>
                        <SaveIcon className="w-5 h-5" />
                        <span>{t.saveModifications}</span>
                    </>
                )}
            </button>
        </div>
      )}
    </div>
  );
};

export default Settings;