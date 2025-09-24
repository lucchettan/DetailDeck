import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface TimeFrame {
  from: string;
  to: string;
}

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

interface ScheduleStepProps {
  onBack: () => void;
  onNext: () => void;
}

const TimePicker: React.FC<{ value: string, onChange: (value: string) => void }> = ({ value, onChange }) => {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const [hour, minute] = value.split(':');

  return (
    <div className="flex gap-1">
      <select
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        className="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        {hours.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="self-center">:</span>
      <select
        value={minute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        className="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
};

const ScheduleStep: React.FC<ScheduleStepProps> = ({ onBack, onNext }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const [minBookingNotice, setMinBookingNotice] = useState('4h');
  const [maxBookingHorizon, setMaxBookingHorizon] = useState('12w');
  const [isSaving, setIsSaving] = useState(false);

  const dayLabels = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  const handleScheduleChange = (day: string, field: 'isOpen' | 'timeframes', value: any) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
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
      return newSchedule;
    });
  };

  const handleAddTimeFrame = (day: string) => {
    const currentFrames = schedule[day]?.timeframes || [];
    handleScheduleChange(day, 'timeframes', [...currentFrames, { from: '14:00', to: '18:00' }]);
  };

  const handleRemoveTimeFrame = (day: string, index: number) => {
    const currentFrames = schedule[day]?.timeframes || [];
    const newTimeframes = currentFrames.filter((_, i) => i !== index);
    handleScheduleChange(day, 'timeframes', newTimeframes);
    if (newTimeframes.length === 0) {
      handleScheduleChange(day, 'isOpen', false);
    }
  };

  const handleTimeChange = (day: string, index: number, field: 'from' | 'to', value: string) => {
    const currentFrames = schedule[day]?.timeframes || [];
    const newTimeframes = [...currentFrames];
    newTimeframes[index] = { ...newTimeframes[index], [field]: value };
    handleScheduleChange(day, 'timeframes', newTimeframes);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          schedule,
          min_booking_notice: minBookingNotice,
          max_booking_horizon: maxBookingHorizon
        })
        .eq('owner_id', user.id);

      if (error) throw error;
      onNext();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Horaires d'ouverture</h2>
        <p className="text-gray-600">Définissez vos disponibilités et règles de réservation</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Horaires hebdomadaires</h3>

        {Object.entries(dayLabels).map(([day, label]) => (
          <div key={day} className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">{label}</span>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={schedule[day]?.isOpen || false}
                  onChange={(e) => handleScheduleChange(day, 'isOpen', e.target.checked)}
                  className="mr-2"
                />
                Ouvert
              </label>
            </div>

            {schedule[day]?.isOpen && (
              <div className="space-y-2">
                {schedule[day].timeframes.map((timeframe, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <TimePicker
                      value={timeframe.from}
                      onChange={(value) => handleTimeChange(day, index, 'from', value)}
                    />
                    <span>à</span>
                    <TimePicker
                      value={timeframe.to}
                      onChange={(value) => handleTimeChange(day, index, 'to', value)}
                    />
                    {schedule[day].timeframes.length > 1 && (
                      <button
                        onClick={() => handleRemoveTimeFrame(day, index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => handleAddTimeFrame(day)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Ajouter un créneau
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Règles de réservation</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai minimum de réservation
            </label>
            <select
              value={minBookingNotice}
              onChange={(e) => setMinBookingNotice(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="1h">1 heure</option>
              <option value="2h">2 heures</option>
              <option value="4h">4 heures</option>
              <option value="8h">8 heures</option>
              <option value="1d">1 jour</option>
              <option value="2d">2 jours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horizon maximum de réservation
            </label>
            <select
              value={maxBookingHorizon}
              onChange={(e) => setMaxBookingHorizon(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="1w">1 semaine</option>
              <option value="2w">2 semaines</option>
              <option value="1m">1 mois</option>
              <option value="2m">2 mois</option>
              <option value="3m">3 mois</option>
              <option value="6m">6 mois</option>
              <option value="12w">12 semaines</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Retour
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {isSaving ? 'Sauvegarde...' : 'Continuer →'}
        </button>
      </div>
    </div>
  );
};

export default ScheduleStep;
