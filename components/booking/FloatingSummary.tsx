
import React from 'react';
import { Service } from '../Dashboard';
import { VehicleSize } from '../BookingPage';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDuration, parseSafeInt } from '../../lib/utils';

interface FloatingSummaryProps {
    selectedService: Service | null;
    selectedVehicleSize: VehicleSize | null;
    selectedAddOns: Set<number>;
    totalDuration: number;
    totalPrice: number;
    onButtonClick: () => void;
    buttonText: string;
    buttonDisabled: boolean;
}

const FloatingSummary: React.FC<FloatingSummaryProps> = ({
    selectedService,
    selectedVehicleSize,
    selectedAddOns,
    totalDuration,
    totalPrice,
    onButtonClick,
    buttonText,
    buttonDisabled
}) => {
    const { t } = useLanguage();

    if (!selectedService) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-30">
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex-grow text-center sm:text-left">
                        <div className="font-bold text-2xl text-brand-dark">Total: €{totalPrice}</div>
                        <div className="text-sm text-brand-gray">~ {formatDuration(totalDuration)}</div>
                    </div>
                    <button 
                        onClick={onButtonClick} 
                        disabled={buttonDisabled}
                        className="w-full sm:w-auto bg-brand-blue text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        {buttonText} &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingSummary;
