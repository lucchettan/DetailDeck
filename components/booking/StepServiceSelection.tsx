import React, { useState, useEffect, useMemo } from 'react';
// FIX: Import AddOn type.
import { Service, AddOn } from '../Dashboard';
import { VehicleSize } from '../BookingPage';
import { useLanguage } from '../../contexts/LanguageContext';
import ServiceCard from './ServiceCard';
import { CheckIcon, ChevronLeftIcon, HourglassIcon, MoneyIcon } from '../Icons';
import { formatDuration, parseSafeInt } from '../../lib/utils';

interface StepServiceSelectionProps {
    services: Service[];
    selectedService: Service | null;
    selectedVehicleSize: VehicleSize | null;
    // FIX: AddOn ID is a string.
    selectedAddOns: Set<string>;
    onSelectService: (service: Service) => void;
    onSelectVehicleSize: (size: VehicleSize) => void;
    // FIX: AddOn ID is a string.
    onToggleAddOn: (id: string) => void;
    onComplete: () => void;
    // FIX: Add allAddOns prop to get full details.
    allAddOns: AddOn[];
}

type SubStep = 'list' | 'size' | 'addons';

const StepServiceSelection: React.FC<StepServiceSelectionProps> = ({
    services,
    selectedService,
    selectedVehicleSize,
    selectedAddOns,
    onSelectService,
    onSelectVehicleSize,
    onToggleAddOn,
    onComplete,
    allAddOns,
}) => {
    const { t } = useLanguage();
    const [subStep, setSubStep] = useState<SubStep>('list');

    useEffect(() => {
        if (!selectedService) {
            setSubStep('list');
        }
    }, [selectedService]);

    const availableAddOns = useMemo(() => {
        if (!selectedService || !allAddOns) return [];
        const global = allAddOns.filter(addOn => !addOn.serviceId);
        const specific = allAddOns.filter(addOn => addOn.serviceId === selectedService.id);
        return [...specific, ...global];
    }, [selectedService, allAddOns]);
    
    const handleServiceSelected = (service: Service) => {
        onSelectService(service);
        const serviceHasAddons = allAddOns.some(addOn => addOn.serviceId === service.id || !addOn.serviceId);

        if (service.varies) {
            setSubStep('size');
        } else if (serviceHasAddons) {
            setSubStep('addons');
        } else {
            onComplete();
        }
    };

    const handleSizeSelected = (size: VehicleSize) => {
        onSelectVehicleSize(size);
        const serviceHasAddons = allAddOns.some(addOn => addOn.serviceId === selectedService?.id || !addOn.serviceId);
        if (selectedService && serviceHasAddons) {
            setSubStep('addons');
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (subStep === 'addons') {
            if (selectedService?.varies) {
                setSubStep('size');
            } else {
                setSubStep('list');
            }
        } else if (subStep === 'size') {
            setSubStep('list');
        }
    };

    const BackButton = () => (
        <button onClick={handleBack} className="flex items-center gap-2 font-semibold text-brand-gray hover:text-brand-dark transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
            <span>{t.back}</span>
        </button>
    );

    switch (subStep) {
        case 'list':
            return (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.selectService}</h2>
                    {services.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {services.map(service => (
                                <ServiceCard key={service.id} service={service} onSelect={() => handleServiceSelected(service)} />
                            ))}
                        </div>
                    ) : <p className="text-brand-gray bg-white p-6 rounded-lg shadow-md">{t.noServicesAvailable}</p>}
                </div>
            );
        
        case 'size':
            if (!selectedService?.varies) return null;
            return (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.selectVehicleSize}</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
                        {Object.entries(selectedService.pricing).filter(([, details]) => details.enabled).map(([size, details]) => (
                            <button key={size} onClick={() => handleSizeSelected(size as VehicleSize)} className="w-full text-left p-4 border rounded-lg bg-white hover:border-brand-blue flex justify-between items-center transition-all">
                                <div>
                                    <p className="font-bold">{t[`size_${size as 'S'|'M'|'L'|'XL'}`]}</p>
                                    <p className="text-sm text-brand-gray flex items-center gap-1 mt-1">
                                       <HourglassIcon className="w-4 h-4"/> <span>{formatDuration(parseSafeInt(details.duration))}</span>
                                    </p>
                                </div>
                                <p className="font-bold text-lg flex items-center gap-1"><MoneyIcon className="w-5 h-5"/>€{details.price}</p>
                            </button>
                        ))}
                    </div>
                    <div className="mt-6"><BackButton /></div>
                </div>
            );

        case 'addons':
            if (!selectedService || availableAddOns.length === 0) return null;
            return (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.selectAddOns}</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
                        {/* FIX: Iterate over the available AddOn objects. */}
                        {availableAddOns.map(addOn => (
                            <button key={addOn.id} onClick={() => onToggleAddOn(addOn.id)} className={`w-full text-left p-4 border rounded-lg flex justify-between items-center transition-all ${selectedAddOns.has(addOn.id) ? 'border-brand-blue ring-2 ring-brand-blue' : 'hover:border-gray-400'}`}>
                                <div className="flex items-center">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center mr-4 flex-shrink-0 ${selectedAddOns.has(addOn.id) ? 'bg-brand-blue' : 'border-2'}`}>
                                        {selectedAddOns.has(addOn.id) && <CheckIcon className="w-4 h-4 text-white" />}
                                    </div>
                                    <div>
                                        <p className="font-bold">{addOn.name}</p>
                                        <p className="text-sm text-brand-gray flex items-center gap-1 mt-1">
                                            <HourglassIcon className="w-4 h-4"/> <span>{formatDuration(parseSafeInt(addOn.duration))}</span>
                                        </p>
                                    </div>
                                </div>
                                <p className="font-bold text-lg flex items-center gap-1"><MoneyIcon className="w-5 h-5"/>€{addOn.price}</p>
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                        <BackButton />
                        <button onClick={onComplete} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600">{t.nextStep}</button>
                    </div>
                </div>
            );
            
        default:
            return null;
    }
};

export default StepServiceSelection;