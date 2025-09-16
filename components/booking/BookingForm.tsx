import React, { useRef, useEffect } from 'react';
import { Service } from '../Dashboard';
import { VehicleSize } from '../BookingPage';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckBadgeIcon, HourglassIcon, ImageIcon } from '../Icons';
import { formatDuration, parseSafeInt } from '../../lib/utils';

interface BookingFormProps {
    services: Service[];
    clientVehicle: string;
    onClientVehicleChange: (value: string) => void;
    selectedService: Service | null;
    onSelectService: (service: Service | null) => void;
    selectedVehicleSize: VehicleSize | null;
    onSelectVehicleSize: (size: VehicleSize) => void;
    selectedAddOns: Set<number>;
    onToggleAddOn: (id: number) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
    services,
    clientVehicle,
    onClientVehicleChange,
    selectedService,
    onSelectService,
    selectedVehicleSize,
    onSelectVehicleSize,
    selectedAddOns,
    onToggleAddOn,
}) => {
    const { t } = useLanguage();
    const vehicleSizeRef = useRef<HTMLDivElement>(null);
    const addOnsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedService) {
            if (selectedService.varies && !selectedVehicleSize) {
                vehicleSizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (selectedService.addOns && selectedService.addOns.length > 0) {
                 addOnsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [selectedService]);

    const getPriceDisplay = (price: string | undefined | null) => {
        if (!price || isNaN(parseInt(price))) return 'N/A';
        return `€${price}`;
    }
    
    const getStartingPriceDisplay = (service: Service) => {
        if (!service.varies) {
            return { price: getPriceDisplay(service.singlePrice.price), duration: formatDuration(parseSafeInt(service.singlePrice.duration)) };
        }
        const prices = Object.values(service.pricing || {}).filter(p => p.enabled && p.price).map(p => parseInt(p.price!));
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const minPriceDuration = Object.values(service.pricing || {}).find(p => p.enabled && parseInt(p.price!) === minPrice)?.duration;
            return { price: t.fromPrice.replace('{price}', minPrice.toString()), duration: formatDuration(parseSafeInt(minPriceDuration)) };
        }
        return { price: 'N/A', duration: ''};
    }

    const showVehicleSelection = selectedService && selectedService.varies;
    const showAddons = selectedService && selectedService.addOns.length > 0;

    return (
        <div className="space-y-8">
             {/* Client Vehicle */}
            <div>
                <label htmlFor="clientVehicle" className="text-xl font-bold text-brand-dark mb-4 block">{t.whatIsYourVehicle}</label>
                 <input 
                    id="clientVehicle"
                    type="text"
                    value={clientVehicle}
                    onChange={(e) => onClientVehicleChange(e.target.value)}
                    placeholder={t.whatIsYourVehiclePlaceholder}
                    className="w-full p-4 bg-white rounded-lg border-2 border-gray-200 focus:border-brand-blue focus:ring-0 outline-none transition"
                 />
            </div>

            {/* Main Service Selection */}
            <div>
                <h2 className="text-xl font-bold text-brand-dark mb-4">{t.chooseMainService}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map(service => {
                        const isSelected = selectedService?.id === service.id;
                        const { price, duration } = getStartingPriceDisplay(service);

                        return (
                            <button 
                                key={service.id}
                                onClick={() => onSelectService(isSelected ? null : service)}
                                className={`relative text-left bg-white rounded-lg shadow-md hover:shadow-xl border-2 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden ${isSelected ? 'border-brand-blue' : 'border-transparent'}`}
                            >
                                {service.imageUrl ? (
                                    <div className="h-40 w-full">
                                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover"/>
                                    </div>
                                ) : (
                                    <div className="h-40 w-full bg-gray-100 flex items-center justify-center">
                                        <ImageIcon className="w-12 h-12 text-gray-300" />
                                    </div>
                                )}
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-brand-dark pr-2">{service.name}</h3>
                                        </div>
                                        <p className="text-brand-gray mt-2 text-sm min-h-[40px] line-clamp-2">{service.description}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-brand-dark">{price}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-brand-gray">
                                            <HourglassIcon className="w-4 h-4" />
                                            <span>{duration}</span>
                                        </div>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center text-white">
                                        <CheckBadgeIcon className="w-7 h-7" />
                                    </div>
                                )}
                            </button>
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
                                className={`p-4 rounded-lg border-2 text-center transition-all duration-200 flex flex-col justify-between h-full ${selectedVehicleSize === size ? 'bg-blue-50 border-brand-blue' : 'bg-white border-gray-200 hover:border-gray-300'}`}
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
                         {selectedService.addOns.map(addon => {
                            const isSelected = selectedAddOns.has(addon.id);
                            return (
                                <button key={addon.id} onClick={() => onToggleAddOn(addon.id)} className={`w-full text-left p-4 rounded-lg border-2 flex justify-between items-center transition-all duration-200 ${isSelected ? 'bg-blue-50 border-brand-blue' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
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