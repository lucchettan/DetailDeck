
import React, { useState, useEffect } from 'react';
import { Service } from '../Dashboard';
import { VehicleSize } from '../BookingPage';
import { useLanguage } from '../../contexts/LanguageContext';
import ServiceCard from './ServiceCard';
import { CheckIcon, ChevronLeftIcon } from '../Icons';

interface StepServiceSelectionProps {
    services: Service[];
    selectedService: Service | null;
    selectedVehicleSize: VehicleSize | null;
    selectedAddOns: Set<number>;
    onSelectService: (service: Service) => void;
    onSelectVehicleSize: (size: VehicleSize) => void;
    onToggleAddOn: (id: number) => void;
    onComplete: () => void;
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
    onComplete
}) => {
    const { t } = useLanguage();
    const [subStep, setSubStep] = useState<SubStep>('list');

    useEffect(() => {
        if (!selectedService) {
            setSubStep('list');
        }
    }, [selectedService]);

    const handleServiceSelected = (service: Service) => {
        onSelectService(service);
        if (service.varies) {
            setSubStep('size');
        } else if (service.addOns && service.addOns.length > 0) {
            setSubStep('addons');
        } else {
            onComplete();
        }
    };

    const handleSizeSelected = (size: VehicleSize) => {
        onSelectVehicleSize(size);
        if (selectedService?.addOns && selectedService.addOns.length > 0) {
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
                                    <p className="text-sm text-brand-gray">{details.duration} min</p>
                                </div>
                                <p className="font-bold text-lg">€{details.price}</p>
                            </button>
                        ))}
                    </div>
                    <div className="mt-6"><BackButton /></div>
                </div>
            );

        case 'addons':
            if (!selectedService || selectedService.addOns.length === 0) return null;
            return (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.selectAddOns}</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
                        {selectedService.addOns.map(addOn => (
                            <button key={addOn.id} onClick={() => onToggleAddOn(addOn.id)} className={`w-full text-left p-4 border rounded-lg flex justify-between items-center transition-all ${selectedAddOns.has(addOn.id) ? 'border-brand-blue ring-2 ring-brand-blue' : 'hover:border-gray-400'}`}>
                                <div className="flex items-center">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center mr-4 flex-shrink-0 ${selectedAddOns.has(addOn.id) ? 'bg-brand-blue' : 'border-2'}`}>
                                        {selectedAddOns.has(addOn.id) && <CheckIcon className="w-4 h-4 text-white" />}
                                    </div>
                                    <div>
                                        <p className="font-bold">{addOn.name}</p>
                                        <p className="text-sm text-brand-gray">{addOn.duration} min</p>
                                    </div>
                                </div>
                                <p className="font-bold text-lg">€{addOn.price}</p>
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
