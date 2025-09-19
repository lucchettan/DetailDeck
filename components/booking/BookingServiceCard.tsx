import React, { useState, useEffect, memo } from 'react';
import { Service } from '../Dashboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, HourglassIcon, CheckBadgeIcon } from '../Icons';
import { formatDuration, parseSafeInt } from '../../lib/utils';

interface BookingServiceCardProps {
    service: Service;
    isSelected: boolean;
    onSelect: () => void;
    index: number;
}

const BookingServiceCard: React.FC<BookingServiceCardProps> = ({ service, isSelected, onSelect, index }) => {
    const { t } = useLanguage();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [canLoadImage, setCanLoadImage] = useState(false);

    useEffect(() => {
        // Stagger image loading
        const timer = setTimeout(() => {
            setCanLoadImage(true);
        }, index * 100); // 100ms delay per card

        return () => clearTimeout(timer);
    }, [index]);

    const getStartingPriceDisplay = (service: Service) => {
        if (!service.varies) {
            const price = service.singlePrice?.price && !isNaN(parseInt(service.singlePrice.price)) ? `€${service.singlePrice.price}` : 'N/A';
            return { price, duration: formatDuration(parseSafeInt(service.singlePrice?.duration)) };
        }
        const prices = Object.values(service.pricing || {}).filter(p => p.enabled && p.price).map(p => parseInt(p.price!));
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const minPriceDuration = Object.values(service.pricing || {}).find(p => p.enabled && parseInt(p.price!) === minPrice)?.duration;
            return { price: t.fromPrice.replace('{price}', minPrice.toString()), duration: formatDuration(parseSafeInt(minPriceDuration)) };
        }
        return { price: 'N/A', duration: ''};
    }

    const { price, duration } = getStartingPriceDisplay(service);

    return (
        <button
            onClick={onSelect}
            className={`relative text-left bg-white rounded-lg shadow-md hover:shadow-xl border-2 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden ${isSelected ? 'border-brand-blue ring-2 ring-brand-blue/50' : 'border-transparent hover:border-brand-blue/50'}`}
        >
            <div className="h-40 w-full bg-gray-100 relative">
                {service.imageUrl && canLoadImage ? (
                    <>
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-gray-300 animate-pulse" />
                            </div>
                        )}
                        <img
                            src={service.imageUrl}
                            alt={service.name}
                            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            loading="lazy"
                            onLoad={() => setImageLoaded(true)}
                        />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                )}
            </div>
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
    );
};

export default memo(BookingServiceCard);