import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon as XMarkIcon, CheckIcon, CloseIcon as CancelIcon } from '../Icons';
import { ShopVehicleSize, Service } from '../../types/database';
import { supabase } from '../../lib/supabaseClient';
import { toSnakeCase } from '../../lib/utils';
import { IS_MOCK_MODE } from '../../lib/env';

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

  const handleSaveUpdates = async () => {
    setLoading(true);

    try {
      if (IS_MOCK_MODE) {
        console.log('Mock mode: Would update services with new vehicle size', {
          vehicleSize: newVehicleSize,
          updates: serviceUpdates
        });
        setTimeout(() => {
          onServicesUpdated();
          onClose();
          setLoading(false);
        }, 1000);
        return;
      }

      // Create supplements for each service
      const supplementsToInsert = serviceUpdates.map(update => ({
        service_id: update.serviceId,
        vehicle_size_id: newVehicleSize.id,
        additional_price: update.additionalPrice,
        additional_duration: update.additionalDuration
      }));

      const { error } = await supabase
        .from('service_vehicle_size_supplements')
        .insert(supplementsToInsert);

      if (error) throw error;

      onServicesUpdated();
      onClose();

    } catch (err: any) {
      console.error('Error updating services:', err);
      // Could show error message here
    } finally {
      setLoading(false);
    }
  };

  const updateServiceData = (serviceId: string, field: 'additionalPrice' | 'additionalDuration', value: string) => {
    const numValue = Number(value) || 0;
    setServiceUpdates(prev => prev.map(update =>
      update.serviceId === serviceId
        ? { ...update, [field]: numValue }
        : update
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              ⚠️
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Nouvelle taille de véhicule ajoutée
              </h2>
              <p className="text-sm text-gray-600">
                "{newVehicleSize.name}" a été ajoutée à vos tailles disponibles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!showUpdateForm ? (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Voulez-vous mettre à jour vos services existants?
                </h3>
                <p className="text-gray-600">
                  Vous pouvez définir maintenant les prix et durées supplémentaires pour
                  la nouvelle taille "{newVehicleSize.name}" sur tous vos services,
                  ou le faire plus tard individuellement.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Services concernés:</h4>
                <div className="text-sm text-blue-800">
                  {services.map(service => (
                    <div key={service.id} className="py-1">• {service.name}</div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Je le ferai plus tard
                </button>
                <button
                  onClick={handleUpdateNow}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  Mettre à jour maintenant
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Configurer "{newVehicleSize.name}" pour chaque service
                </h3>
                <p className="text-sm text-gray-600">
                  Définissez le prix et la durée supplémentaires pour cette nouvelle taille de véhicule.
                </p>
              </div>

              <div className="space-y-6">
                {serviceUpdates.map(update => (
                  <div key={update.serviceId} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{update.serviceName}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix supplémentaire (€)
                        </label>
                        <input
                          type="number"
                          value={update.additionalPrice}
                          onChange={(e) => updateServiceData(update.serviceId, 'additionalPrice', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durée supplémentaire (min)
                        </label>
                        <input
                          type="number"
                          step="15"
                          value={update.additionalDuration}
                          onChange={(e) => updateServiceData(update.serviceId, 'additionalDuration', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowUpdateForm(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <CancelIcon className="w-4 h-4 mr-2 inline" />
                  Retour
                </button>
                <button
                  onClick={handleSaveUpdates}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-4 h-4 mr-2 inline" />
                  {loading ? 'Mise à jour...' : 'Sauvegarder'}
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
