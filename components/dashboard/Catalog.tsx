
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Service } from '../Dashboard';
import { PlusIcon } from '../Icons';

interface CatalogProps {
  services: Service[];
  onEditService: (serviceId: string | null) => void;
}

const Catalog: React.FC<CatalogProps> = ({ services, onEditService }) => {
  const { t } = useLanguage();

  const getPriceDisplay = (service: Service): string => {
      if (service.varies) {
          const enabledPrices = Object.values(service.pricing)
              .filter(p => p.enabled && p.price)
              .map(p => parseInt(p.price!, 10));
          if (enabledPrices.length === 0) return 'N/A';
          const minPrice = Math.min(...enabledPrices);
          return `From €${minPrice}`;
      }
      return service.singlePrice?.price ? `€${service.singlePrice.price}` : 'N/A';
  }


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-brand-dark">{t.manageServices}</h2>
            <p className="text-brand-gray mt-1">{t.manageServicesSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button 
            onClick={() => onEditService(null)}
            className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-blue hover:bg-blue-50 transition-all duration-300 text-brand-gray hover:text-brand-dark"
        >
            <PlusIcon className="w-10 h-10 mb-2" />
            <span className="font-bold text-lg">{t.addNewService}</span>
        </button>
        
        {services.map(service => (
          <div 
            key={service.id} 
            onClick={() => onEditService(service.id)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-brand-blue border border-transparent transition-all duration-300 cursor-pointer flex flex-col"
          >
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-brand-dark pr-2">{service.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {t[service.status as 'active' | 'inactive']}
                </span>
              </div>
              <p className="text-brand-gray mt-2 text-sm min-h-[40px]">{service.description}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xl font-bold text-brand-dark">{getPriceDisplay(service)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalog;
