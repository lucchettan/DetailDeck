
import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { CloseIcon, ImageIcon, PlusIcon, SaveIcon, StorefrontIcon, ClockIcon, ShieldCheckIcon, UserCircleIcon, KeyIcon, BuildingOffice2Icon, TruckIcon, MapPinIcon, CarIcon } from '../Icons';
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
  // FIX: Explicitly type `defaults` as `Partial<Shop>` to ensure `businessType` is not inferred as a generic `string`.
  const defaults: Partial<Shop> = {
    businessType: 'local', // Gardé pour compatibilité
    hasLocalService: true, // Par défaut, service en atelier activé
    hasMobileService: false, // Par défaut, service mobile désactivé
    minBookingNotice: '4h',
    maxBookingHorizon: '12w',
    schedule: initialSchedule,
  };

  if (shopData) {
    // Migration des anciennes données businessType vers les nouveaux champs
    let hasLocalService = shopData.hasLocalService;
    let hasMobileService = shopData.hasMobileService;

    // Si les nouveaux champs n'existent pas, on migre depuis businessType
    if (hasLocalService === undefined && hasMobileService === undefined) {
      hasLocalService = shopData.businessType === 'local' || shopData.businessType === 'hybrid';
      hasMobileService = shopData.businessType === 'mobile' || shopData.businessType === 'hybrid';
    }

    return {
      ...defaults,
      ...shopData,
      hasLocalService,
      hasMobileService,
      schedule: shopData.schedule || initialSchedule,
    };
  }
  return defaults;
};

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
  onNavigateHome?: () => void;
}


const Settings: React.FC<SettingsProps> = ({ shopData, onSave, initialStep, onNavigateHome }) => {
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
    { id: 3, label: t.tabPolicies, icon: <ShieldCheckIcon />, isComplete: (data: Partial<Shop>) => !!data.minBookingNotice },
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
    let updateData = { ...formData };

    if (updateData.businessType === 'mobile') {
      updateData.serviceAreas = city ? [{ city, radius: parseInt(radius, 10) }] : [];
      updateData.addressLine1 = undefined;
      updateData.addressCity = undefined;
      updateData.addressPostalCode = undefined;
      updateData.addressCountry = undefined;
    } else {
      updateData.serviceAreas = [];
    }

    delete updateData.id;
    delete (updateData as Partial<Shop> & { ownerId?: string }).ownerId;


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
      {/* Bouton retour à l'accueil */}
      <div className="mb-4">
        <button
          onClick={onNavigateHome || (() => window.history.back())}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l'accueil
        </button>
      </div>

      <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.settings}</h2>
      <p className="text-brand-gray mb-6">{t.settingsSubtitle}</p>

      <div className="flex items-center gap-4 w-full mb-8 flex-wrap">
        {steps.map((step) => {
          const isCompleted = step.isComplete(formData);
          const isCurrent = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${isCurrent
                ? 'bg-blue-50 border-brand-blue shadow-md'
                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isCurrent ? 'bg-blue-100' : 'bg-gray-100'
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

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg border border-blue-100">
        {activeStep === 1 && (
          <div>
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3"><StorefrontIcon className="w-6 h-6 text-brand-blue" /> {t.businessDetails}</h3>
              <TopSaveButton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-2">{t.shopImage}</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                    {formData.shopImageUrl ? <img src={formData.shopImageUrl} alt="Shop" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-400" />}
                  </div>
                  <input type="file" id="shopImageUpload" className="hidden" onChange={handleImageChange} accept="image/*" />
                  <label htmlFor="shopImageUpload" className="bg-gray-200 text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">{t.uploadImage}</label>
                </div>
              </div>
              <div></div>

              <div>
                <label htmlFor="shopName" className="block text-sm font-bold text-brand-dark mb-1">{t.shopName}</label>
                <input type="text" id="shopName" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full p-2 border border-gray-300 shadow-sm rounded-lg bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-brand-dark mb-1">{t.phoneNumber}</label>
                <input type="tel" id="phone" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full p-2 border border-gray-300 shadow-sm rounded-lg bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" />
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <label className="block text-sm font-bold text-brand-dark mb-2">Type de service</label>
              <p className="text-sm text-gray-600 mb-4">Vous pouvez proposer les deux types de service</p>
              <div className="flex gap-4">
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all flex-1 ${formData.hasLocalService ? 'border-brand-blue bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <input
                    type="checkbox"
                    checked={formData.hasLocalService || false}
                    onChange={(e) => handleInputChange('hasLocalService', e.target.checked)}
                    className="h-4 w-4 text-brand-blue border-gray-300 focus:ring-brand-blue rounded"
                  />
                  <span className="ml-3 flex items-center gap-2 font-semibold text-brand-dark"><BuildingOffice2Icon className="w-5 h-5" /> Service en atelier</span>
                </label>
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all flex-1 ${formData.hasMobileService ? 'border-brand-blue bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <input
                    type="checkbox"
                    checked={formData.hasMobileService || false}
                    onChange={(e) => handleInputChange('hasMobileService', e.target.checked)}
                    className="h-4 w-4 text-brand-blue border-gray-300 focus:ring-brand-blue rounded"
                  />
                  <span className="ml-3 flex items-center gap-2 font-semibold text-brand-dark"><TruckIcon className="w-5 h-5" /> Service mobile</span>
                </label>
              </div>
            </div>

            {formData.hasLocalService && (
              <div className="border-t pt-6 mt-6">
                <h4 className="font-bold text-brand-dark flex items-center gap-2 mb-2"><MapPinIcon className="w-5 h-5" /> {t.address}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={formData.addressLine1 || ''} onChange={(e) => handleInputChange('addressLine1', e.target.value)} placeholder={t.addressPlaceholder} className="w-full p-2 border border-gray-300 shadow-sm rounded-lg bg-white md:col-span-2" />
                  <input value={formData.addressCity || ''} onChange={(e) => handleInputChange('addressCity', e.target.value)} placeholder={t.cityPlaceholder} className="w-full p-2 border border-gray-300 shadow-sm rounded-lg bg-white" />
                  <input value={formData.addressPostalCode || ''} onChange={(e) => handleInputChange('addressPostalCode', e.target.value)} placeholder="Code Postal" className="w-full p-2 border border-gray-300 shadow-sm rounded-lg bg-white" />
                </div>
              </div>
            )}
            {formData.hasMobileService && (
              <div className="border-t pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-brand-dark flex items-center gap-2"><MapPinIcon className="w-5 h-5" /> Zones de service</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newZones = [...(formData.serviceZones || [{ city: city, radius: radius }]), { city: '', radius: '10' }];
                      handleInputChange('serviceZones', newZones);
                    }}
                    className="btn btn-secondary flex items-center gap-2 text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Ajouter une zone
                  </button>
                </div>

                <div className="space-y-4">
                  {(formData.serviceZones || [{ city: city, radius: radius }]).map((zone, index) => (
                    <div key={index} className="card p-4 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="form-label">{t.operatingCity}</label>
                          <input
                            value={zone.city || ''}
                            onChange={(e) => {
                              const newZones = [...(formData.serviceZones || [])];
                              newZones[index] = { ...newZones[index], city: e.target.value };
                              handleInputChange('serviceZones', newZones);
                            }}
                            placeholder={t.cityPlaceholder}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">{t.serviceRadius}</label>
                          <select
                            value={zone.radius || '10'}
                            onChange={(e) => {
                              const newZones = [...(formData.serviceZones || [])];
                              newZones[index] = { ...newZones[index], radius: e.target.value };
                              handleInputChange('serviceZones', newZones);
                            }}
                            className="form-input"
                          >
                            {radiusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div>
                          {(formData.serviceZones || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newZones = (formData.serviceZones || []).filter((_, i) => i !== index);
                                handleInputChange('serviceZones', newZones);
                              }}
                              className="btn btn-ghost text-red-500 hover:text-red-700 p-2"
                            >
                              <CloseIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                              <button onClick={() => handleRemoveTimeFrame(day, index)} className="text-gray-400 hover:text-red-500"><CloseIcon /></button>
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
              <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3"><ShieldCheckIcon className="w-6 h-6 text-brand-blue" /> {t.bookingPolicies}</h3>
              <TopSaveButton />
            </div>
            <p className="text-brand-gray mb-6 text-sm">{t.bookingPoliciesSubtitle}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="minBookingNotice" className="block text-sm font-bold text-brand-dark">{t.minBookingNotice}</label>
                <p className="text-xs text-brand-gray mb-2">{t.minBookingNoticeSubtitle}</p>
                <select id="minBookingNotice" value={formData.minBookingNotice || '4h'} onChange={(e) => handleInputChange('minBookingNotice', e.target.value)} className="w-full p-2 border border-gray-300 shadow-sm rounded-lg bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue">
                  {noticeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="maxBookingHorizon" className="block text-sm font-bold text-brand-dark">{t.maxBookingHorizon}</label>
                <p className="text-xs text-brand-gray mb-2">{t.maxBookingHorizonSubtitle}</p>
                <select id="maxBookingHorizon" value={formData.maxBookingHorizon || '12w'} onChange={(e) => handleInputChange('maxBookingHorizon', e.target.value)} className="w-full p-2 border border-gray-300 shadow-sm rounded-lg bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue">
                  {horizonOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">{t.confirmNewPassword}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" required />
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
