
import React, { useRef, useEffect, useMemo } from 'react';
import { Service } from '../Dashboard';
import { VehicleSize } from '../BookingPage';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckBadgeIcon, HourglassIcon, ImageIcon } from '../Icons';
import { formatDuration, parseSafeInt } from '../../lib/utils';
import BookingServiceCard from './BookingServiceCard';

// Represents a unifed add-on for the booking form, can be global or specific
type AvailableAddOn = { 
    id: string; 
    name: string; 
    price: string; 
    duration: string 
};
interface BookingFormProps {
    services: Service[];
    selectedService: Service | null;
    onSelectService: (service: Service | null) => void;
    selectedVehicleSize: VehicleSize | null;
    onSelectVehicleSize: (size: VehicleSize) => void;
    selectedAddOns: Set<string>;
    onToggleAddOn: (id: string) => void;
    availableAddOns: AvailableAddOn[];
}

const BookingForm: React.FC<BookingFormProps> = ({
    services,
    selectedService,
    onSelectService,
    selectedVehicleSize,
    onSelectVehicleSize,
    selectedAddOns,
    onToggleAddOn,
    availableAddOns,
}) => {
    const { t } = useLanguage();
    const vehicleSizeRef = useRef<HTMLDivElement>(null);
    const addOnsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedService) {
            if (selectedService.varies && !selectedVehicleSize) {
                vehicleSizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (availableAddOns.length > 0) {
                 addOnsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [selectedService, selectedVehicleSize, availableAddOns]);

    const getPriceDisplay = (price: string | undefined | null) => {
        if (!price || isNaN(parseInt(price))) return 'N/A';
        return `€${price}`;
    }

    const showVehicleSelection = selectedService && selectedService.varies;
    const showAddons = selectedService && availableAddOns.length > 0;

    return (
        <div className="space-y-8 pb-24">
            {/* Main Service Selection */}
            <div>
                <h2 className="text-xl font-bold text-brand-dark mb-4">{t.chooseMainService}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map((service, index) => {
                        const isSelected = selectedService?.id === service.id;
                        return (
                            <BookingServiceCard
                                key={service.id}
                                service={service}
                                isSelected={isSelected}
                                onSelect={() => onSelectService(isSelected ? null : service)}
                                index={index}
                            />
                        )
                    })}
                </div>
            </div>
            
            {/* Vehicle Size Selection */}
            {showVehicleSelection && (
                <div ref={vehicleSizeRef}>
                    <h2 className="text-xl font-bold text-brand-dark mb-4">{t.selectVehicleSize}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(selectedService.pricing).filter(([, details]) => details.enabled).map(([size, details]) => (
                             <button 
                                key={size} 
                                onClick={() => onSelectVehicleSize(size as VehicleSize)}
                                className={`p-4 rounded-lg border-2 text-center transition-all duration-200 flex flex-col justify-between h-full ${selectedVehicleSize === size ? 'bg-blue-50 border-brand-blue ring-2 ring-brand-blue/50' : 'bg-white border-gray-200 hover:border-brand-blue'}`}
                            >
                                <p className="font-bold text-brand-dark">{t[`size_${size as VehicleSize}`]}</p>
                                <p className="text-xs text-brand-gray mt-1">{formatDuration(parseSafeInt(details.duration))}</p>
                                <p className="text-2xl text-brand-dark mt-2 font-bold">{getPriceDisplay(details.price)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Add-On Services */}
            {showAddons && (
                 <div ref={addOnsRef}>
                    <h2 className="text-xl font-bold text-brand-dark mb-4">{t.addOnServices}</h2>
                    <div className="space-y-3">
                         {availableAddOns.map(addon => {
                            const isSelected = selectedAddOns.has(addon.id);
                            return (
                                <button key={addon.id} onClick={() => onToggleAddOn(addon.id)} className={`w-full text-left p-4 rounded-lg border-2 flex justify-between items-center transition-all duration-200 ${isSelected ? 'bg-blue-50 border-brand-blue ring-2 ring-brand-blue/50' : 'bg-white border-gray-200 hover:border-brand-blue'}`}>
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <p className="font-bold text-brand-dark">{addon.name}</p>
                                        <div className="flex items-center gap-3 text-sm font-semibold mt-1 sm:mt-0">
                                            <span className="text-brand-blue">+{getPriceDisplay(addon.price)}</span>
                                            <span className="font-normal text-brand-gray flex items-center gap-1"><HourglassIcon className="w-4 h-4"/>{formatDuration(parseSafeInt(addon.duration))}</span>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                      {isSelected && <CheckBadgeIcon className="w-7 h-7 text-brand-blue"/>}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default BookingForm;
