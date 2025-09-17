import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Service, AddOn } from '../Dashboard';
import { PlusIcon, ImageIcon, MoneyIcon, HourglassIcon, InformationCircleIcon, ListBulletIcon, CustomServicesIcon } from '../Icons';
import { formatDuration } from '../../lib/utils';

interface CatalogProps {
  services: Service[];
  addOns: AddOn[];
  onEditService: (serviceId: string | null) => void;
  onEditAddOn: (addOnId: string | null) => void;
}

type TabType = 'services' | 'addons';

const Catalog: React.FC<CatalogProps> = ({ services, addOns, onEditService, onEditAddOn }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('services');

  const globalAddOns = useMemo(() => addOns.filter(a => !a.serviceId), [addOns]);

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

  const tabs = useMemo(() => [
    { id: 'services', label: t.tabServices, icon: <ListBulletIcon /> },
    { id: 'addons', label: t.tabAddOns, icon: <CustomServicesIcon /> },
  ], [t]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-brand-dark">{t.catalog}</h2>
            <p className="text-brand-gray mt-1">
                {activeTab === 'services' ? t.manageServicesSubtitle : t.manageAddOnsSubtitle}
            </p>
        </div>
      </div>
      
      {/* Tabs as Buttons */}
      <div className="flex items-center gap-4 w-full mb-8">
        {tabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 w-full md:w-auto ${
                    isCurrent
                        ? 'bg-blue-50 border-brand-blue shadow-md'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                        isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                        {React.cloneElement(tab.icon, {
                            className: `w-5 h-5 ${isCurrent ? 'text-brand-blue' : 'text-gray-500'}`
                        })}
                    </div>
                    <div>
                        <p className={`font-semibold transition-colors ${isCurrent ? 'text-brand-blue' : 'text-brand-dark'}`}>
                            {tab.label}
                        </p>
                    </div>
                </button>
            )
        })}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
        {activeTab === 'services' && (
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
                  className="bg-white rounded-lg shadow-md hover:shadow-xl hover:border-brand-blue border border-gray-200 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden"
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
                      <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-brand-dark pr-2">{service.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {t[service.status as 'active' | 'inactive']}
                          </span>
                      </div>
                      <p className="text-brand-gray mt-2 text-sm min-h-[40px]">{service.description}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                          <MoneyIcon className="w-6 h-6 text-gray-400"/>
                          <p className="text-xl font-bold text-brand-dark">{getPriceDisplay(service)}</p>
                      </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'addons' && (
          <div>
            <p className="text-brand-gray mb-6 flex items-center gap-2 text-sm">
              <span>{t.addOnsGlobalInfo}</span>
              <span title={t.addOnsTooltip} className="cursor-help">
                  <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button 
                    onClick={() => onEditAddOn(null)}
                    className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-blue hover:bg-blue-50 transition-all duration-300 text-brand-gray hover:text-brand-dark"
                >
                    <PlusIcon className="w-10 h-10 mb-2" />
                    <span className="font-bold text-lg">{t.addNewAddOn}</span>
                </button>
                {globalAddOns.map(addOn => (
                    <div key={addOn.id} onClick={() => onEditAddOn(addOn.id)} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-brand-blue border border-gray-200 transition-all duration-300 cursor-pointer">
                        <h3 className="text-lg font-bold text-brand-dark">{addOn.name}</h3>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-brand-dark">
                            <span className="font-semibold flex items-center gap-2"><MoneyIcon className="w-5 h-5 text-gray-400"/> €{addOn.price}</span>
                            <span className="font-semibold flex items-center gap-2"><HourglassIcon className="w-5 h-5 text-gray-400"/> {formatDuration(parseInt(addOn.duration))}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;