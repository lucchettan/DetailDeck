

import React from 'react';
import { Service } from '../Dashboard';
import { ImageIcon, MoneyIcon, HourglassIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDuration, parseSafeInt } from '../../lib/utils';

interface ServiceCardProps {
  service: Service;
  onSelect: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
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
        
        if (service.singlePrice && service.singlePrice.price && !isNaN(parseInt(service.singlePrice.price, 10))) {
            return `€${service.singlePrice.price}`;
        }
        
        return 'N/A';
    }

    const getDurationDisplay = (service: Service): string => {
        let durationMins = 0;
        if (service.varies) {
            const prices = service.pricing && typeof service.pricing === 'object' 
                ? Object.values(service.pricing)
                : [];
            
            const enabledOptions = prices
                .filter(p => p && p.enabled && p.price && !isNaN(parseInt(p.price, 10)))
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

    return (
        <div 
            onClick={onSelect}
            className="bg-white rounded-lg shadow-md hover:shadow-xl hover:border-brand-blue border border-transparent transition-all duration-300 cursor-pointer flex flex-col overflow-hidden"
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
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-brand-dark pr-2">{service.name}</h3>
                    <p className="text-brand-gray mt-2 text-sm min-h-[40px] line-clamp-2">{service.description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex flex-col">
                        <p className="text-xl font-bold text-brand-dark">{getPriceDisplay(service)}</p>
                         <p className="text-sm text-brand-gray flex items-center gap-1 mt-1">
                            <HourglassIcon className="w-4 h-4"/>
                            <span>{getDurationDisplay(service)}</span>
                        </p>
                    </div>
                    <button className="font-bold text-brand-blue text-sm">{t.selectService} &rarr;</button>
                </div>
            </div>
        </div>
    );
};

export default ServiceCard;
