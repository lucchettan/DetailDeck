import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShopVehicleSize, ShopServiceCategory } from "../../types";
import VehicleSizeManager from './VehicleSizeManager';
import ServiceCategoryManager from './ServiceCategoryManager';
import { CloseIcon as XMarkIcon, CogIcon as SettingsIcon, CarIcon, TagIcon } from '../Icons';

interface CatalogSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  vehicleSizes: ShopVehicleSize[];
  serviceCategories: ShopServiceCategory[];
  onNewVehicleSizeAdded?: (newSize: ShopVehicleSize) => void;
  onDataUpdated?: () => void;
}

const CatalogSettings: React.FC<CatalogSettingsProps> = ({
  isOpen,
  onClose,
  shopId,
  vehicleSizes,
  serviceCategories,
  onNewVehicleSizeAdded,
  onDataUpdated
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Paramètres du Catalogue</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>


        {/* Content - Single page layout */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-8">

          {/* Service Categories Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <TagIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Catégories de Services</h3>
                <p className="text-sm text-gray-600">
                  Organisez vos services en catégories personnalisées ({serviceCategories.length} catégories)
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <ServiceCategoryManager
                isOpen={true}
                onClose={() => { }}
                shopId={shopId}
                serviceCategories={serviceCategories}
                onDataUpdated={onDataUpdated}
                embedded={true}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Vehicle Sizes Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CarIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tailles de Véhicules</h3>
                <p className="text-sm text-gray-600">
                  Configurez les tailles de véhicules supportées ({vehicleSizes.length} tailles)
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <VehicleSizeManager
                isOpen={true}
                onClose={() => { }}
                shopId={shopId}
                vehicleSizes={vehicleSizes}
                onNewVehicleSizeAdded={onNewVehicleSizeAdded}
                onDataUpdated={onDataUpdated}
                embedded={true}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CatalogSettings;
