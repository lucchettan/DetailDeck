
import React from 'react';
import { Service } from '../Dashboard';
import { ImageIcon, MoneyIcon } from '../Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ServiceCardProps {
  service: Service;
  onSelect: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
    const { t } = useLanguage();

    const getPriceDisplay = (service: Service): string => {
        if (service.varies) {
            const enabledPrices = Object.values(service.pricing)
                .filter(p => p.enabled && p.price)
                .map(p => parseInt(p.price!, 10));
            if (enabledPrices.length === 0) return 'N/A';
            const minPrice = Math.min(...enabledPrices);
            return `À partir de €${minPrice}`;
        }
        return service.singlePrice?.price ? `€${service.singlePrice.price}` : 'N/A';
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
                    <p className="text-brand-gray mt-2 text-sm min-h-[40px]">{service.description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MoneyIcon className="w-6 h-6 text-gray-400"/>
                        <p className="text-xl font-bold text-brand-dark">{getPriceDisplay(service)}</p>
                    </div>
                    <button className="font-bold text-brand-blue text-sm">{t.selectService} &rarr;</button>
                </div>
            </div>
        </div>
    );
};

export default ServiceCard;
