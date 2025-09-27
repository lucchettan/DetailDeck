import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, CheckIcon, PlusIcon, MinusIcon } from '../Icons';
import { formatDuration } from '../../lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  base_duration: number;
  image_urls: string[];
  formulas?: Array<{
    name: string;
    additionalPrice: number;
    additionalDuration: number;
    includedItems: string[];
  }>;
  vehicle_size_variations?: { [key: string]: { price: number; duration: number } };
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  service_id: string;
}

interface VehicleSize {
  id: string;
  name: string;
}

interface ServiceSelectionCardProps {
  service: Service;
  vehicleSize: VehicleSize | undefined;
  addOns: AddOn[];
  selectedAddOns: string[];
  selectedFormula?: string;
  onSelect: (addOnIds: string[], formulaId?: string) => void;
  onRemove: () => void;
  isSelected: boolean;
}

const ServiceSelectionCard: React.FC<ServiceSelectionCardProps> = ({
  service,
  vehicleSize,
  addOns,
  selectedAddOns,
  selectedFormula,
  onSelect,
  onRemove,
  isSelected
}) => {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const [localSelectedAddOns, setLocalSelectedAddOns] = useState<string[]>(selectedAddOns);
  const [localSelectedFormula, setLocalSelectedFormula] = useState<string | undefined>(selectedFormula);

  // Calculer le prix total avec la taille de véhicule
  const getTotalPrice = () => {
    let price = service.base_price;
    
    // Ajouter la variation par taille
    if (vehicleSize && service.vehicle_size_variations?.[vehicleSize.id]) {
      price += service.vehicle_size_variations[vehicleSize.id].price;
    }
    
    // Ajouter la formule
    if (localSelectedFormula && service.formulas) {
      const formula = service.formulas.find(f => f.name === localSelectedFormula);
      if (formula) {
        price += formula.additionalPrice;
      }
    }
    
    // Ajouter les add-ons
    const selectedAddOnObjects = addOns.filter(addon => localSelectedAddOns.includes(addon.id));
    price += selectedAddOnObjects.reduce((sum, addon) => sum + addon.price, 0);
    
    return price;
  };

  // Calculer la durée totale
  const getTotalDuration = () => {
    let duration = service.base_duration;
    
    // Ajouter la variation par taille
    if (vehicleSize && service.vehicle_size_variations?.[vehicleSize.id]) {
      duration += service.vehicle_size_variations[vehicleSize.id].duration;
    }
    
    // Ajouter la formule
    if (localSelectedFormula && service.formulas) {
      const formula = service.formulas.find(f => f.name === localSelectedFormula);
      if (formula) {
        duration += formula.additionalDuration;
      }
    }
    
    // Ajouter les add-ons
    const selectedAddOnObjects = addOns.filter(addon => localSelectedAddOns.includes(addon.id));
    duration += selectedAddOnObjects.reduce((sum, addon) => sum + addon.duration, 0);
    
    return duration;
  };

  const handleAddOnToggle = (addOnId: string) => {
    const newSelectedAddOns = localSelectedAddOns.includes(addOnId)
      ? localSelectedAddOns.filter(id => id !== addOnId)
      : [...localSelectedAddOns, addOnId];
    
    setLocalSelectedAddOns(newSelectedAddOns);
    onSelect(newSelectedAddOns, localSelectedFormula);
  };

  const handleFormulaSelect = (formulaName: string) => {
    const newFormula = localSelectedFormula === formulaName ? undefined : formulaName;
    setLocalSelectedFormula(newFormula);
    onSelect(localSelectedAddOns, newFormula);
  };

  const handleToggleSelection = () => {
    if (isSelected) {
      onRemove();
    } else {
      onSelect(localSelectedAddOns, localSelectedFormula);
    }
  };

  const serviceAddOns = addOns.filter(addon => addon.service_id === service.id);

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Header du service */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
            {service.description && (
              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
            )}
          </div>
          <button
            onClick={handleToggleSelection}
            className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors ${
              isSelected
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isSelected ? 'Retirer' : 'Ajouter'}
          </button>
        </div>

        {/* Prix et durée */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{getTotalPrice()}€</span>
            <span className="mx-2">•</span>
            <span>{formatDuration(getTotalDuration())}</span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            {showDetails ? 'Masquer détails' : 'Voir détails'}
          </button>
        </div>
      </div>

      {/* Détails dépliables */}
      {showDetails && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Formules */}
          {service.formulas && service.formulas.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Formules disponibles</h4>
              <div className="space-y-2">
                {service.formulas.map((formula) => (
                  <label key={formula.name} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`formula-${service.id}`}
                      checked={localSelectedFormula === formula.name}
                      onChange={() => handleFormulaSelect(formula.name)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{formula.name}</span>
                        <span className="text-sm text-gray-600">
                          +{formula.additionalPrice}€ • +{formatDuration(formula.additionalDuration)}
                        </span>
                      </div>
                      {formula.includedItems.length > 0 && (
                        <ul className="mt-1 text-xs text-gray-500">
                          {formula.includedItems.map((item, index) => (
                            <li key={index}>• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {serviceAddOns.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Add-ons disponibles</h4>
              <div className="space-y-2">
                {serviceAddOns.map((addon) => (
                  <label key={addon.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSelectedAddOns.includes(addon.id)}
                      onChange={() => handleAddOnToggle(addon.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{addon.name}</span>
                        <span className="text-sm text-gray-600">
                          +{addon.price}€ • +{formatDuration(addon.duration)}
                        </span>
                      </div>
                      {addon.description && (
                        <p className="text-xs text-gray-500 mt-1">{addon.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceSelectionCard;
