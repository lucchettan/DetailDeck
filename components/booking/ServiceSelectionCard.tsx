import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, CheckIcon, PlusIcon, MinusIcon } from '../Icons';
import { formatDuration } from '../../lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  baseDuration: number;
  imageUrls: string[];
  formulas?: Array<{
    name: string;
    additionalPrice: number;
    additionalDuration: number;
    includedItems: string[];
  }>;
  vehicleSizeVariations?: { [key: string]: { price: number; duration: number } };
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  serviceId: string;
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
  const [localSelectedAddOns, setLocalSelectedAddOns] = useState<string[]>(selectedAddOns);
  const [localSelectedFormula, setLocalSelectedFormula] = useState<string | undefined>(selectedFormula);


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

  const serviceAddOns = addOns.filter(addon => addon.serviceId === service.id);

  return (
    <div className={`overflow-hidden rounded-lg shadow-md border-2 transition-all duration-200 hover:-translate-y-0.5 ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
      }`}>
      {/* Image principale en haut (style catalogue) */}
      {service.imageUrls && service.imageUrls.length > 0 ? (
        <img
          src={service.imageUrls[0]}
          alt={service.name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="h-40 w-full bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-gray-300" />
        </div>
      )}

      {/* Contenu de la carte */}
      <div className="p-4">
        {/* Titre et description */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
          {service.description && (
            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
          )}
        </div>

        {/* Prix et durée de base */}
        <div className="mt-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{service.basePrice}€</span>
            <span className="mx-2">•</span>
            <span>{formatDuration(service.baseDuration)}</span>
            <span className="text-xs text-gray-400 ml-2">(prix de base)</span>
          </div>
        </div>
      </div>

      {/* Détails toujours visibles */}
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
                        {formula.additionalPrice}€ • {formatDuration(formula.additionalDuration)}
                      </span>
                    </div>
                    {formula.includedItems.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-500 space-y-1">
                        {formula.includedItems.map((item, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
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
                        {addon.price}€ • {formatDuration(addon.duration)}
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

      {/* Bouton d'action en bas de la carte */}
      <div className="border-t border-gray-100 p-4">
        <button
          onClick={handleToggleSelection}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors text-sm ${isSelected
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          {isSelected ? 'Retirer du panier' : 'Ajouter au panier'}
        </button>
      </div>
    </div>
  );
};

export default ServiceSelectionCard;
