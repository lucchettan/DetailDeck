import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDuration } from '../../lib/utils';

interface FloatingSummaryProps {
    totalDuration: number;
    totalPrice: number;
    onButtonClick: () => void;
    buttonText: string;
    buttonDisabled: boolean;
    isConfirming?: boolean;
}

const FloatingSummary: React.FC<FloatingSummaryProps> = ({
    totalDuration,
    totalPrice,
    onButtonClick,
    buttonText,
    buttonDisabled,
    isConfirming
}) => {
    const { t } = useLanguage();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-30">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center gap-4">
                    <div className="text-left">
                        <p className="text-2xl font-extrabold text-brand-dark">€{totalPrice}</p>
                        <p className="text-sm text-brand-gray">{formatDuration(totalDuration)}</p>
                    </div>
                    <button 
                        onClick={onButtonClick} 
                        disabled={buttonDisabled}
                        className="w-full sm:w-auto bg-brand-blue text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center min-w-[200px]"
                    >
                        {isConfirming ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                           buttonText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingSummary;