
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ClientInfo, ClientInfoErrors } from '../BookingPage';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon } from '../Icons';

interface StepClientInfoProps {
    clientInfo: ClientInfo;
    setClientInfo: React.Dispatch<React.SetStateAction<ClientInfo>>;
    errors: ClientInfoErrors;
    specialInstructions: string;
    onSpecialInstructionsChange: (value: string) => void;
    clientVehicle: string;
    onClientVehicleChange: (value: string) => void;
}

const StepClientInfo: React.FC<StepClientInfoProps> = ({ 
    clientInfo, 
    setClientInfo, 
    errors, 
    specialInstructions, 
    onSpecialInstructionsChange,
    clientVehicle,
    onClientVehicleChange
}) => {
    const { t } = useLanguage();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setClientInfo(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-brand-dark mb-4">{t.yourInformation}</h2>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="clientVehicle" className="block text-sm font-medium text-brand-dark mb-1">{t.whatIsYourVehicle}</label>
                    <input
                        id="clientVehicle"
                        type="text"
                        value={clientVehicle}
                        onChange={(e) => onClientVehicleChange(e.target.value)}
                        placeholder={t.whatIsYourVehiclePlaceholder}
                        className={`w-full p-2 border bg-white shadow-sm rounded-lg focus:outline-none focus:ring-1 ${errors.vehicle ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`}
                        required
                    />
                    {errors.vehicle && <p className="text-red-500 text-xs mt-1">{errors.vehicle}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-brand-dark mb-1">{t.firstName}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="text" name="firstName" id="firstName" value={clientInfo.firstName} onChange={handleChange} placeholder={t.firstNamePlaceholder} className={`w-full p-2 pl-10 border bg-white shadow-sm rounded-lg focus:outline-none focus:ring-1 ${errors.firstName ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`} required />
                        </div>
                        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-brand-dark mb-1">{t.lastName}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="text" name="lastName" id="lastName" value={clientInfo.lastName} onChange={handleChange} placeholder={t.lastNamePlaceholder} className={`w-full p-2 pl-10 border bg-white shadow-sm rounded-lg focus:outline-none focus:ring-1 ${errors.lastName ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`} required />
                        </div>
                        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-1">{t.emailAddress}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="email" name="email" id="email" value={clientInfo.email} onChange={handleChange} placeholder={t.emailPlaceholder} className={`w-full p-2 pl-10 border bg-white shadow-sm rounded-lg focus:outline-none focus:ring-1 ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`} required />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-dark mb-1">{t.phoneNumber}</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="tel" name="phone" id="phone" value={clientInfo.phone} onChange={handleChange} placeholder={t.phoneNumberPlaceholder} className={`w-full p-2 pl-10 border bg-white shadow-sm rounded-lg focus:outline-none focus:ring-1 ${errors.phone ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`} required />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                     <label htmlFor="specialInstructions" className="block text-sm font-medium text-brand-dark mb-1">{t.specialInstructions}</label>
                     <textarea 
                        id="specialInstructions"
                        value={specialInstructions}
                        onChange={(e) => onSpecialInstructionsChange(e.target.value)}
                        rows={3}
                        placeholder={t.specialInstructionsPlaceholder}
                        className="w-full p-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition"
                     />
                </div>
            </div>
        </div>
    );
};

export default StepClientInfo;
