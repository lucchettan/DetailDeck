
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
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


const Availability: React.FC = () => {
  const { t } = useLanguage();
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);

  // FIX: Use 'as const' to create a readonly tuple with literal types.
  // This helps TypeScript infer a more specific type for `day` in the map function,
  // which resolves the issue of `t[...]` being inferred as a broad, un-renderable type.
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  const handleToggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
        // Add a default timeframe if opening a closed day
        timeframes: !prev[day].isOpen && prev[day].timeframes.length === 0 
          ? [{ from: '09:00', to: '17:00' }] 
          : prev[day].timeframes
      }
    }));
  };
  
  const handleAddTimeFrame = (day: string) => {
    setSchedule(prev => ({
        ...prev,
        [day]: {
            ...prev[day],
            timeframes: [...prev[day].timeframes, { from: '14:00', to: '18:00' }]
        }
    }));
  };
  
  const handleRemoveTimeFrame = (day: string, index: number) => {
     setSchedule(prev => ({
        ...prev,
        [day]: {
            ...prev[day],
            timeframes: prev[day].timeframes.filter((_, i) => i !== index)
        }
    }));
  };
  
  const handleTimeChange = (day: string, index: number, field: 'from' | 'to', value: string) => {
    setSchedule(prev => {
        const newTimeframes = [...prev[day].timeframes];
        newTimeframes[index] = { ...newTimeframes[index], [field]: value };
        return {
            ...prev,
            [day]: {
                ...prev[day],
                timeframes: newTimeframes
            }
        };
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.businessHours}</h2>
      <p className="text-brand-gray mb-6">{t.businessHoursSubtitle}</p>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="space-y-6">
          {daysOfWeek.map(day => (
            <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b pb-6 last:border-b-0">
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
                                <input type="time" value={frame.from} onChange={e => handleTimeChange(day, index, 'from', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue" />
                                <span className="text-sm text-brand-gray">{t.to}</span>
                                <input type="time" value={frame.to} onChange={e => handleTimeChange(day, index, 'to', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue" />
                                <button onClick={() => handleRemoveTimeFrame(day, index)} className="text-gray-400 hover:text-red-500">
                                    <CloseIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                        <button onClick={() => handleAddTimeFrame(day)} className="text-sm text-brand-blue font-semibold hover:underline">
                            + {t.addTimeframe}
                        </button>
                    </div>
                ) : (
                  <p className="text-brand-gray font-medium">{t.closed}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-end">
          <button className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Availability;
