
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const ShopInformation: React.FC = () => {
  const { t } = useLanguage();
  const [businessType, setBusinessType] = useState<'local' | 'mobile'>('local');
  const [address, setAddress] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.shopInformation}</h2>
      <p className="text-brand-gray mb-6">{t.setupShopSubtitle}</p>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <label className="block text-sm font-bold text-brand-dark mb-2">{t.businessType}</label>
          <div className="flex space-x-4">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer flex-1">
              <input 
                type="radio" 
                name="businessType" 
                value="local"
                checked={businessType === 'local'}
                onChange={() => setBusinessType('local')}
                className="h-4 w-4 text-brand-blue border-gray-300 focus:ring-brand-blue"
              />
              <span className="ml-3 font-medium text-brand-dark">{t.localBusiness}</span>
            </label>
            <label className="flex items-center p-4 border rounded-lg cursor-pointer flex-1">
              <input 
                type="radio" 
                name="businessType" 
                value="mobile"
                checked={businessType === 'mobile'}
                onChange={() => setBusinessType('mobile')}
                className="h-4 w-4 text-brand-blue border-gray-300 focus:ring-brand-blue"
              />
              <span className="ml-3 font-medium text-brand-dark">{t.mobileBusiness}</span>
            </label>
          </div>
        </div>

        {businessType === 'local' ? (
          <div>
            <label htmlFor="address" className="block text-sm font-bold text-brand-dark mb-2">{t.address}</label>
            <input 
              type="text" 
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t.addressPlaceholder} 
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="serviceAreas" className="block text-sm font-bold text-brand-dark mb-2">{t.serviceAreas}</label>
            <textarea
              id="serviceAreas"
              rows={4}
              value={serviceAreas}
              onChange={(e) => setServiceAreas(e.target.value)}
              placeholder={t.serviceAreasPlaceholder}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue"
            ></textarea>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopInformation;
