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
    <div className="flex items-center gap-2">
      <select
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[60px]"
      >
        {hours.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-gray-500 font-medium">:</span>
      <select
        value={minute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[60px]"
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
  const [maxBookingHorizon, setMaxBookingHorizon] = useState('6m');
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
          opening_hours: schedule,
          booking_rules: {
            min_booking_notice: minBookingNotice,
            max_booking_horizon: maxBookingHorizon
          }
        })
        .eq('email', user.email);

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
        <h2 className="text-3xl font-bold text-gray-900">Horaires d'activité</h2>
      </div>

      {/* Règles de réservation en premier */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Règles de réservation</h3>
        </div>
        <p className="text-gray-600 mb-6">Configurez les délais et horizons de réservation pour vos clients</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quel est le délai minimum pour qu'un client puisse réserver ?
            </label>
            <select
              value={minBookingNotice}
              onChange={(e) => setMinBookingNotice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="1h">1 heure</option>
              <option value="2h">2 heures</option>
              <option value="4h">4 heures</option>
              <option value="8h">8 heures</option>
              <option value="1d">1 jour</option>
              <option value="2d">2 jours</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">Temps minimum avant qu'un client puisse réserver</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Jusqu'à combien de temps à l'avance vos clients peuvent-ils réserver ?
            </label>
            <select
              value={maxBookingHorizon}
              onChange={(e) => setMaxBookingHorizon(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="1w">Jusqu'à 1 semaine à l'avance</option>
              <option value="2w">Jusqu'à 2 semaines à l'avance</option>
              <option value="1m">Jusqu'à 1 mois à l'avance</option>
              <option value="2m">Jusqu'à 2 mois à l'avance</option>
              <option value="3m">Jusqu'à 3 mois à l'avance</option>
              <option value="6m">Jusqu'à 6 mois à l'avance</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">Définissez jusqu'à quand vos clients peuvent réserver à l'avance</p>
          </div>
        </div>
      </div>

      {/* Horaires hebdomadaires */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Horaires d'activité</h3>
        </div>
        <p className="text-gray-600 mb-6">Définissez vos créneaux d'activité pour chaque jour de la semaine</p>

        <div className="space-y-4">
          {Object.entries(dayLabels).map(([day, label]) => (
            <div key={day} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-gray-600">{label.charAt(0)}</span>
                  </div>
                  <span className="font-medium text-gray-900">{label}</span>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule[day]?.isOpen || false}
                    onChange={(e) => handleScheduleChange(day, 'isOpen', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${schedule[day]?.isOpen ? 'bg-green-600' : 'bg-gray-300'
                    }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule[day]?.isOpen ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {schedule[day]?.isOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                </label>
              </div>

              {schedule[day]?.isOpen && (
                <div className="space-y-3 pl-4">
                  {schedule[day].timeframes.map((timeframe, index) => (
                    <div key={index} className="flex items-center gap-4 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <TimePicker
                          value={timeframe.from}
                          onChange={(value) => handleTimeChange(day, index, 'from', value)}
                        />
                        <span className="text-gray-500">à</span>
                        <TimePicker
                          value={timeframe.to}
                          onChange={(value) => handleTimeChange(day, index, 'to', value)}
                        />
                      </div>
                      {schedule[day].timeframes.length > 1 && (
                        <button
                          onClick={() => handleRemoveTimeFrame(day, index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Supprimer ce créneau"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddTimeFrame(day)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter un créneau
                  </button>
                </div>
              )}
            </div>
          ))}
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
