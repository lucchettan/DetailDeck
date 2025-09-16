
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ClientInfo, ClientInfoErrors } from '../BookingPage';

interface StepClientInfoProps {
    clientInfo: ClientInfo;
    setClientInfo: React.Dispatch<React.SetStateAction<ClientInfo>>;
    errors: ClientInfoErrors;
}

const StepClientInfo: React.FC<StepClientInfoProps> = ({ clientInfo, setClientInfo, errors }) => {
    const { t } = useLanguage();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setClientInfo(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-brand-dark mb-4">{t.yourInformation}</h2>
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-brand-dark mb-1">{t.firstName}</label>
                        <input type="text" name="firstName" id="firstName" value={clientInfo.firstName} onChange={handleChange} placeholder={t.firstNamePlaceholder} className={`w-full p-2 border rounded-lg ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`} required />
                        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-brand-dark mb-1">{t.lastName}</label>
                        <input type="text" name="lastName" id="lastName" value={clientInfo.lastName} onChange={handleChange} placeholder={t.lastNamePlaceholder} className={`w-full p-2 border rounded-lg ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`} required />
                        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-1">{t.emailAddress}</label>
                    <input type="email" name="email" id="email" value={clientInfo.email} onChange={handleChange} placeholder={t.emailPlaceholder} className={`w-full p-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`} required />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-dark mb-1">{t.phoneNumber}</label>
                    <input type="tel" name="phone" id="phone" value={clientInfo.phone} onChange={handleChange} placeholder={t.phoneNumberPlaceholder} className={`w-full p-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} required />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
            </div>
        </div>
    );
};

export default StepClientInfo;
