
import React from 'react';
import { Service } from '../Dashboard';
import { VehicleSize } from '../BookingPage';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircleIcon, HourglassIcon } from '../Icons';
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
    totalDuration: number;
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
    totalDuration,
}) => {
    const { t } = useLanguage();

    const getPriceDisplay = (price: string | undefined | null) => {
        if (!price || isNaN(parseInt(price))) return 'N/A';
        return `€${price}`;
    }

    const showVehicleSelection = selectedService && selectedService.varies;
    const showAddons = selectedService && selectedService.addOns.length > 0;

    return (
        <div className="space-y-8">
            {/* Main Service Selection */}
            <div>
                <h2 className="text-xl font-bold text-brand-dark mb-4">{t.chooseMainService}</h2>
                <div className="space-y-3">
                    {services.map(service => {
                        const isSelected = selectedService?.id === service.id;
                        let priceText = '';

                        if (service.varies) {
                             const prices = Object.values(service.pricing || {}).filter(p => p.enabled && p.price).map(p => parseInt(p.price!));
                             if (prices.length > 0) {
                                priceText = t.fromPrice.replace('{price}', Math.min(...prices).toString());
                             }
                        } else {
                            priceText = getPriceDisplay(service.singlePrice.price);
                        }

                        return (
                            <button 
                                key={service.id}
                                onClick={() => onSelectService(isSelected ? null : service)}
                                className={`w-full text-left p-4 rounded-lg border-2 flex justify-between items-start transition-all duration-200 ${isSelected ? 'bg-blue-50 border-brand-blue' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="flex-1 pr-4">
                                    <p className="font-bold text-brand-dark">{service.name}</p>
                                    <p className="text-sm text-brand-gray mt-1 line-clamp-2">{service.description}</p>
                                    <div className="flex items-center gap-4 text-sm font-semibold text-brand-dark mt-2">
                                        <span>{priceText}</span>
                                        <span className="flex items-center gap-1"><HourglassIcon className="w-4 h-4 text-gray-500" />{formatDuration(parseSafeInt(service.varies ? service.pricing.S?.duration : service.singlePrice.duration))}</span>
                                    </div>
                                </div>
                                {isSelected && <CheckCircleIcon className="w-8 h-8 text-brand-blue flex-shrink-0"/>}
                            </button>
                        )
                    })}
                </div>
            </div>
            
            {/* Vehicle Size Selection */}
            {showVehicleSelection && (
                <div>
                    <h2 className="text-xl font-bold text-brand-dark mb-4">{t.selectVehicleSize}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(selectedService.pricing).filter(([, details]) => details.enabled).map(([size, details]) => (
                             <button 
                                key={size} 
                                onClick={() => onSelectVehicleSize(size as VehicleSize)}
                                className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${selectedVehicleSize === size ? 'bg-blue-50 border-brand-blue' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                            >
                                <p className="font-bold text-brand-dark">{t[`size_${size as VehicleSize}`]}</p>
                                <p className="text-sm text-brand-dark mt-1 font-semibold">{getPriceDisplay(details.price)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Add-On Services */}
            {showAddons && (
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
                                            +{getPriceDisplay(addon.price)} &bull; {formatDuration(parseSafeInt(addon.duration))}
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
            
             {/* Service Timeline */}
            {selectedService && (
                <div>
                    <h2 className="text-xl font-bold text-brand-dark mb-4">{t.serviceTimeline}</h2>
                    <div className="p-4 bg-blue-50 rounded-lg space-y-2 text-brand-dark">
                        <div className="flex justify-between">
                            <span>{selectedService.name}{selectedVehicleSize ? ` (${t[`size_${selectedVehicleSize}`]})` : ''}</span>
                            <span>{formatDuration(parseSafeInt(selectedService.varies && selectedVehicleSize ? selectedService.pricing[selectedVehicleSize]?.duration : selectedService.singlePrice?.duration))}</span>
                        </div>
                        {Array.from(selectedAddOns).map(id => {
                            const addon = selectedService.addOns.find(a => a.id === id);
                            if (!addon) return null;
                            return (
                                <div key={id} className="flex justify-between">
                                    <span>{addon.name}</span>
                                    <span>{formatDuration(parseSafeInt(addon.duration))}</span>
                                </div>
                            )
                        })}
                        <div className="flex justify-between font-bold border-t border-gray-300 pt-2 mt-2">
                            <span>{t.totalDuration}</span>
                            <span>{formatDuration(totalDuration)}</span>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default BookingForm;
