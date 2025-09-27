import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon as XMarkIcon, CheckIcon, CancelIcon } from '../Icons';
import { ShopVehicleSize, Service } from "../../types";
import { supabase } from '../../lib/supabaseClient';
import { IS_MOCK_MODE } from '../../lib/env';
import DurationPicker from '../common/DurationPicker';

interface VehicleSizeUpdatePromptProps {
  isOpen: boolean;
  onClose: () => void;
  newVehicleSize: ShopVehicleSize;
  services: Service[];
  onServicesUpdated: () => void;
}

interface ServiceUpdateData {
  serviceId: string;
  serviceName: string;
  additionalPrice: number;
  additionalDuration: number;
}

const VehicleSizeUpdatePrompt: React.FC<VehicleSizeUpdatePromptProps> = ({
  isOpen,
  onClose,
  newVehicleSize,
  services,
  onServicesUpdated
}) => {
  const { t } = useLanguage();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [serviceUpdates, setServiceUpdates] = useState<ServiceUpdateData[]>(
    services.map(service => ({
      serviceId: service.id,
      serviceName: service.name,
      additionalPrice: 0,
      additionalDuration: 0
    }))
  );
  const [loading, setLoading] = useState(false);

  const handleSkip = () => {
    onClose();
  };

  const handleUpdateNow = () => {
    setShowUpdateForm(true);
  };

  const handleServiceUpdate = (index: number, field: keyof ServiceUpdateData, value: number) => {
    const newUpdates = [...serviceUpdates];
    (newUpdates[index] as any)[field] = value;
    setServiceUpdates(newUpdates);
  };

  const handleSaveUpdates = async () => {
    setLoading(true);
    try {
      if (IS_MOCK_MODE) {
        // Mock mode simulation
        console.log('Mock: Updating services with new vehicle size supplements');
        setTimeout(() => {
          setLoading(false);
          onServicesUpdated();
        }, 1000);
        return;
      }

      // Update each service with the new vehicle size supplement
      for (const update of serviceUpdates) {
        if (update.additionalPrice > 0 || update.additionalDuration > 0) {
          const { error } = await supabase
            .from('service_vehicle_size_supplements')
            .insert({
              service_id: update.serviceId,
              vehicle_size_id: newVehicleSize.id,
              additional_price: update.additionalPrice,
              additional_duration: update.additionalDuration
            });

          if (error) {
            console.error('Error updating service supplement:', error);
          }
        }
      }

      onServicesUpdated();
    } catch (error) {
      console.error('Error saving service updates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-blue-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Nouvelle taille de véhicule ajoutée
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {!showUpdateForm ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Vous avez ajouté la taille de véhicule <strong>"{newVehicleSize.name}"</strong>.
              </p>
              <p className="text-gray-600">
                Voulez-vous configurer les suppléments de prix et durée pour cette nouvelle taille sur vos services existants ?
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ignorer pour l'instant
                </button>
                <button
                  onClick={handleUpdateNow}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Configurer maintenant
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-gray-600">
                Configurez les suppléments pour la taille <strong>"{newVehicleSize.name}"</strong> :
              </p>

              <div className="space-y-4">
                {serviceUpdates.map((update, index) => (
                  <div key={update.serviceId} className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3">{update.serviceName}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix additionnel (€)
                        </label>
                        <input
                          type="number"
                          value={update.additionalPrice}
                          onChange={(e) => handleServiceUpdate(index, 'additionalPrice', Number(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durée additionnelle
                        </label>
                        <DurationPicker
                          value={update.additionalDuration}
                          onChange={(value) => handleServiceUpdate(index, 'additionalDuration', Number(value))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Aucune"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveUpdates}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Sauvegarder
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleSizeUpdatePrompt;
