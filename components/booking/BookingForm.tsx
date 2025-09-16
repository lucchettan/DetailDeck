
import React from 'react';
import { Service } from '../Dashboard';
import { VehicleSize } from '../BookingPage';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircleIcon, HourglassIcon, MoneyIcon } from '../Icons';
import { formatDuration, parseSafeInt } from '../../lib/utils';

interface BookingFormProps {
    services: Service[];
    selectedService: Service | null;
    onSelectService: (service: Service | null) => void;
    selectedVehicleSize: VehicleSize | null;
    onSelectVehicleSize: (size: VehicleSize) => void;
    selectedAddOns: Set<number>;
    onToggleAddOn: (id: number) => void;
    specialInstructions: string;
    onSpecialInstructionsChange: (value: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
    services,
    selectedService,
    onSelectService,
    selectedVehicleSize,
    onSelectVehicleSize,
    selectedAddOns,
    onToggleAddOn,
    specialInstructions,
    onSpecialInstructionsChange,
}) => {
    const { t } = useLanguage();

    const getPriceDisplay = (service: Service): string => {
        if (service.varies) {
            const prices = service.pricing && typeof service.pricing === 'object' 
                ? Object.values(service.pricing)
                : [];
            const enabledPrices = prices
                .filter(p => p && p.enabled && p.price && !isNaN(parseInt(p.price, 10)))
                .map(p => parseInt(p.price!, 10));
            if (enabledPrices.length === 0) return 'N/A';
            const minPrice = Math.min(...enabledPrices);
            return t.fromPrice.replace('{price}', minPrice.toString());
        }
        if (service.singlePrice?.price) return `€${service.singlePrice.price}`;
        return 'N/A';
    }

    const getDurationDisplay = (service: Service): string => {
        let durationMins = 0;
        if (service.varies) {
            const prices = Object.values(service.pricing || {});
            const enabledOptions = prices
                .filter(p => p.enabled && p.price)
                .map(p => ({ price: parseInt(p.price!, 10), duration: parseSafeInt(p.duration) }));

            if (enabledOptions.length === 0) return '';
            
            const minPrice = Math.min(...enabledOptions.map(p => p.price));
            const optionWithMinPrice = enabledOptions.find(p => p.price === minPrice);
            durationMins = optionWithMinPrice?.duration || 0;

        } else {
            durationMins = parseSafeInt(service.singlePrice?.duration);
        }
        return formatDuration(durationMins);
    }
    
    const hasAddons = selectedService && selectedService.addOns.length > 0;

    return (
        <div className="space-y-8">
            {/* Vehicle Size Selection (if applicable on any service) */}
            {services.some(s => s.varies) && (
                <div>
                    <h2 className="text-xl font-bold text-brand-dark mb-4">{t.selectVehicleSize}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['S', 'M', 'L', 'XL'].map(size => (
                             <button 
                                key={size} 
                                onClick={() => onSelectVehicleSize(size as VehicleSize)}
                                className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${selectedVehicleSize === size ? 'bg-blue-50 border-brand-blue' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                            >
                                <p className="font-bold text-brand-dark">{t[`size_${size as VehicleSize}`]}</p>
                                <p className="text-xs text-brand-gray">Description</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Main Service Selection */}
            <div>
                <h2 className="text-xl font-bold text-brand-dark mb-4">{t.chooseMainService}</h2>
                <div className="space-y-3">
                    {services.map(service => {
                        const isSelected = selectedService?.id === service.id;
                        let currentPrice = service.singlePrice?.price;
                        let currentDuration = service.singlePrice?.duration;

                        if (service.varies && selectedVehicleSize) {
                            currentPrice = service.pricing[selectedVehicleSize]?.price;
                            currentDuration = service.pricing[selectedVehicleSize]?.duration;
                        }

                        return (
                            <button 
                                key={service.id}
                                onClick={() => onSelectService(isSelected ? null : service)}
                                className={`w-full text-left p-4 rounded-lg border-2 flex justify-between items-center transition-all duration-200 ${isSelected ? 'bg-blue-50 border-brand-blue' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                                disabled={service.varies && !selectedVehicleSize}
                            >
                                <div className="flex-1 pr-4">
                                    <p className="font-bold text-brand-dark">{service.name}</p>
                                    <p className="text-sm text-brand-gray mt-1">{service.description}</p>
                                    <p className="text-sm font-semibold text-brand-dark mt-2">
                                        {service.varies && !selectedVehicleSize ? (
                                            <span>{getPriceDisplay(service)}</span>
                                        ) : (
                                            <span>€{currentPrice} &bull; {formatDuration(parseSafeInt(currentDuration))}</span>
                                        )}
                                    </p>
                                </div>
                                {isSelected && <CheckCircleIcon className="w-8 h-8 text-brand-blue flex-shrink-0"/>}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Add-On Services */}
            {hasAddons && (
                 <div>
                    <h2 className="text-xl font-bold text-brand-dark mb-4">{t.addOnServices}</h2>
                    <div className="space-y-3">
                         {selectedService.addOns.map(addon => {
                            const isSelected = selectedAddOns.has(addon.id);
                            return (
                                <div key={addon.id} className={`p-4 rounded-lg border-2 flex justify-between items-center transition-all duration-200 ${isSelected ? 'bg-blue-50 border-brand-blue' : 'bg-white border-gray-200'}`}>
                                    <div>
                                        <p className="font-bold text-brand-dark">{addon.name}</p>
                                         <p className="text-sm text-brand-dark mt-1">
                                            +€{addon.price} &bull; {formatDuration(parseSafeInt(addon.duration))}
                                        </p>
                                    </div>
                                    <button onClick={() => onToggleAddOn(addon.id)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isSelected ? 'bg-brand-blue' : 'bg-gray-200'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isSelected ? 'translate-x-6' : 'translate-x-1'}`}/>
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
           
            {/* Special Instructions */}
            <div>
                 <h2 className="text-xl font-bold text-brand-dark mb-4">{t.specialInstructions}</h2>
                 <textarea 
                    value={specialInstructions}
                    onChange={(e) => onSpecialInstructionsChange(e.target.value)}
                    rows={4}
                    placeholder={t.specialInstructionsPlaceholder}
                    className="w-full p-4 bg-white rounded-lg border-2 border-gray-200 focus:border-brand-blue focus:ring-0 outline-none transition"
                 />
            </div>

        </div>
    )
}

export default BookingForm;
