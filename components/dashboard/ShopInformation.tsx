
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { CloseIcon } from '../Icons';

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

type ServiceArea = { id: number; city: string; country: string; range: number; };

const TimePicker: React.FC<{ value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ value, onChange }) => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
  }
  return (
    <select value={value} onChange={onChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
      {times.map(time => <option key={time} value={time}>{time}</option>)}
    </select>
  );
};

const ShopInformation: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Business Details
  const [businessType, setBusinessType] = useState<'local' | 'mobile'>('local');
  const [address, setAddress] = useState('');
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([{ id: 1, city: '', country: 'FR', range: 25 }]);
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Availability
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  const handleToggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
        timeframes: !prev[day].isOpen && prev[day].timeframes.length === 0 
          ? [{ from: '09:00', to: '17:00' }] 
          : prev[day].timeframes
      }
    }));
  };

  const handleAddTimeFrame = (day: string) => {
    setSchedule(prev => ({
        ...prev,
        [day]: { ...prev[day], timeframes: [...prev[day].timeframes, { from: '14:00', to: '18:00' }] }
    }));
  };
  
  const handleRemoveTimeFrame = (day: string, index: number) => {
     setSchedule(prev => {
        const newTimeframes = prev[day].timeframes.filter((_, i) => i !== index);
        return {
            ...prev,
            [day]: {
                ...prev[day],
                timeframes: newTimeframes,
                isOpen: newTimeframes.length > 0
            }
        };
    });
  };
  
  const handleTimeChange = (day: string, index: number, field: 'from' | 'to', value: string) => {
    setSchedule(prev => {
        const newTimeframes = [...prev[day].timeframes];
        newTimeframes[index] = { ...newTimeframes[index], [field]: value };
        return { ...prev, [day]: { ...prev[day], timeframes: newTimeframes } };
    });
  };
  
  const handleServiceAreaChange = (id: number, field: keyof Omit<ServiceArea, 'id'>, value: string | number) => {
      setServiceAreas(prev => prev.map(area => area.id === id ? { ...area, [field]: value } : area));
  };
  
  const addServiceArea = () => {
      setServiceAreas(prev => [...prev, { id: Date.now(), city: '', country: 'FR', range: 25 }]);
  };
  
  const removeServiceArea = (id: number) => {
      setServiceAreas(prev => prev.filter(area => area.id !== id));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.shopInformation}</h2>
      <p className="text-brand-gray mb-6">{t.setupShopSubtitle}</p>
      
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold text-brand-dark mb-4 border-b pb-4">Business Details</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
            <div>
                <label htmlFor="email" className="block text-sm font-bold text-brand-dark mb-2">{t.emailAddress}</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
            </div>
             <div>
                <label htmlFor="phone" className="block text-sm font-bold text-brand-dark mb-2">{t.phoneNumber}</label>
                <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
            </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold text-brand-dark mb-2">{t.businessType}</label>
          <div className="flex space-x-4">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer flex-1">
              <input type="radio" name="businessType" value="local" checked={businessType === 'local'} onChange={() => setBusinessType('local')} className="h-4 w-4 text-brand-blue"/>
              <span className="ml-3 font-medium text-brand-dark">{t.localBusiness}</span>
            </label>
            <label className="flex items-center p-4 border rounded-lg cursor-pointer flex-1">
              <input type="radio" name="businessType" value="mobile" checked={businessType === 'mobile'} onChange={() => setBusinessType('mobile')} className="h-4 w-4 text-brand-blue"/>
              <span className="ml-3 font-medium text-brand-dark">{t.mobileBusiness}</span>
            </label>
          </div>
        </div>
        {businessType === 'local' ? (
          <div>
            <label htmlFor="address" className="block text-sm font-bold text-brand-dark mb-2">{t.address}</label>
            <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} className="w-full p-2 border border-gray-300 rounded-lg"/>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-2">{t.serviceAreas}</label>
            <div className="space-y-4">
              {serviceAreas.map((area) => (
                <div key={area.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <input type="text" placeholder="City" value={area.city} onChange={(e) => handleServiceAreaChange(area.id, 'city', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg"/>
                    <select value={area.country} onChange={(e) => handleServiceAreaChange(area.id, 'country', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                        <option value="FR">France</option>
                        <option value="BE">Belgium</option>
                        <option value="CH">Switzerland</option>
                        <option value="LU">Luxembourg</option>
                    </select>
                    <div className="flex items-center gap-3">
                        <input type="range" min="5" max="100" value={area.range} onChange={(e) => handleServiceAreaChange(area.id, 'range', parseInt(e.target.value))} className="w-full"/>
                        <span className="text-sm font-semibold text-brand-dark w-24 text-center">{area.range >= 100 ? '> 100 km' : `${area.range} km`}</span>
                    </div>
                    <button onClick={() => removeServiceArea(area.id)} className="text-gray-400 hover:text-red-500 justify-self-end">
                        <CloseIcon />
                    </button>
                </div>
              ))}
            </div>
            <button onClick={addServiceArea} className="text-sm text-brand-blue font-semibold hover:underline mt-4">+ Add another area</button>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-brand-dark mb-4 border-b pb-4">{t.businessHours}</h3>
        <p className="text-brand-gray mb-6 text-sm">{t.businessHoursSubtitle}</p>
        <div className="space-y-6">
          {daysOfWeek.map(day => (
            <div key={day} className={`grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b pb-6 last:border-b-0 p-4 rounded-lg transition-all duration-300 ${!schedule[day].isOpen ? 'bg-gray-50 opacity-70' : ''}`}>
              <div className="font-semibold text-brand-dark flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={schedule[day].isOpen} onChange={() => handleToggleDay(day)} />
                    <div className={`block w-14 h-8 rounded-full transition ${schedule[day].isOpen ? 'bg-brand-blue' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${schedule[day].isOpen ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="ml-4 capitalize">{t[`day_${day}`]}</span>
                </label>
              </div>
              <div className="md:col-span-2">
                {schedule[day].isOpen ? (
                    <div className="space-y-3">
                        {schedule[day].timeframes.map((frame, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-sm text-brand-gray">{t.from}</span>
                                <TimePicker value={frame.from} onChange={e => handleTimeChange(day, index, 'from', e.target.value)} />
                                <span className="text-sm text-brand-gray">{t.to}</span>
                                <TimePicker value={frame.to} onChange={e => handleTimeChange(day, index, 'to', e.target.value)} />
                                {schedule[day].timeframes.length > 0 && 
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
        <button className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors">{t.saveChanges}</button>
      </div>
    </div>
  );
};

export default ShopInformation;
