
import React from 'react';
import { Service } from '../Dashboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImageIcon, MoneyIcon, HourglassIcon } from '../Icons';
import { formatDuration } from '../../lib/utils';

interface BookingSummaryProps {
    service: Service;
    vehicleSize: 'S' | 'M' | 'L' | 'XL' | null;
    addOns: { name: string; price: string }[];
    date: Date | null;
    time: string | null;
    totalPrice: number;
    totalDuration: number;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
    service,
    vehicleSize,
    addOns,
    date,
    time,
    totalPrice,
    totalDuration
}) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
            <h3 className="text-xl font-bold text-brand-dark border-b pb-3 mb-4">{t.yourBooking}</h3>
            
            <div className="flex items-start gap-4">
                 {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                ) : (
                    <div className="w-24 h-24 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                )}
                <div>
                    <h4 className="font-bold text-brand-dark">{service.name}</h4>
                    <p className="text-sm text-brand-gray mt-1 line-clamp-2">{service.description}</p>
                </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
                {vehicleSize && (
                    <div className="flex justify-between items-center">
                        <span className="text-brand-gray">{t.vehicleSize}:</span>
                        <span className="font-semibold text-brand-dark">{t[`size_${vehicleSize}`]}</span>
                    </div>
                )}
                {addOns.length > 0 && (
                     <div className="pt-1">
                         <p className="font-semibold text-brand-gray mb-1">{t.addOns}:</p>
                         <ul className="list-disc list-inside pl-2 space-y-1">
                            {addOns.map(addon => (
                                <li key={addon.name} className="flex justify-between">
                                    <span>{addon.name}</span>
                                    <span>+€{addon.price}</span>
                                </li>
                            ))}
                         </ul>
                     </div>
                )}
                {date && time && (
                    <>
                        <div className="flex justify-between items-center pt-2 border-t mt-2">
                            <span className="text-brand-gray">{t.date}:</span>
                            <span className="font-semibold text-brand-dark">{date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-brand-gray">{t.time}:</span>
                            <span className="font-semibold text-brand-dark">{time}</span>
                        </div>
                    </>
                )}
            </div>
            
            <div className="mt-4 pt-4 border-t-2 border-dashed">
                 <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-brand-gray flex items-center gap-2"><HourglassIcon className="w-5 h-5"/> {t.estimatedDuration}</span>
                    <span className="font-semibold text-brand-dark">{formatDuration(totalDuration)}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-brand-gray font-bold text-lg flex items-center gap-2"><MoneyIcon className="w-5 h-5"/> {t.total}</span>
                    <span className="font-extrabold text-brand-dark text-2xl">€{totalPrice}</span>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;