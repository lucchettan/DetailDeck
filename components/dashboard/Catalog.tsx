import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Service } from '../Dashboard';
import { PlusIcon, ImageIcon, MoneyIcon } from '../Icons';

interface CatalogProps {
  services: Service[];
  onEditService: (serviceId: string | null) => void;
  onAddNewService: (category: 'interior' | 'exterior' | 'complementary') => void;
}

const Catalog: React.FC<CatalogProps> = ({ services, onEditService, onAddNewService }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'interior' | 'exterior' | 'complementary'>('interior');

  const { interiorServices, exteriorServices, complementaryServices } = useMemo(() => {
    return services.reduce((acc, service) => {
        if (service.category === 'exterior') {
            acc.exteriorServices.push(service);
        } else if (service.category === 'complementary') {
            acc.complementaryServices.push(service);
        } else {
            acc.interiorServices.push(service);
        }
        return acc;
    }, { 
        interiorServices: [] as Service[], 
        exteriorServices: [] as Service[],
        complementaryServices: [] as Service[]
    });
  }, [services]);

  const serviceCategories = {
    interior: { list: interiorServices, addText: t.addNewInteriorService, label: t.interior },
    exterior: { list: exteriorServices, addText: t.addNewExteriorService, label: t.exterior },
    complementary: { list: complementaryServices, addText: t.addNewComplementaryService, label: t.complementary },
  }

  const ServiceList: React.FC<{
    serviceList: Service[];
    onAdd: () => void;
    addText: string;
  }> = ({ serviceList, onAdd, addText }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <button 
          onClick={onAdd}
          className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-blue hover:bg-blue-50 transition-all duration-300 text-brand-gray hover:text-brand-dark min-h-[280px]"
      >
          <PlusIcon className="w-10 h-10 mb-2" />
          <span className="font-bold text-lg text-center">{addText}</span>
      </button>
      
      {serviceList.map(service => (
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
              <p className="text-brand-gray mt-2 text-sm min-h-[40px] line-clamp-2">{service.description}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                  <MoneyIcon className="w-6 h-6 text-gray-400"/>
                  <p className="text-xl font-bold text-brand-dark">
                    {t.fromPrice.replace('{price}', String(service.basePrice || 0))}
                  </p>
              </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-brand-dark">{t.catalog}</h2>
            <p className="text-brand-gray mt-1">{t.manageServicesSubtitle}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  {Object.keys(serviceCategories).map(catKey => {
                      const category = serviceCategories[catKey as keyof typeof serviceCategories];
                      const isActive = activeTab === catKey;
                      return (
                          <button
                              key={catKey}
                              onClick={() => setActiveTab(catKey as 'interior' | 'exterior' | 'complementary')}
                              className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm flex items-center gap-2
                                  ${isActive 
                                      ? 'border-brand-blue text-brand-blue' 
                                      : 'border-transparent text-brand-gray hover:text-brand-dark hover:border-gray-300'
                                  }`
                              }
                          >
                              {category.label}
                              <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-blue-100 text-brand-blue' : 'bg-gray-100 text-brand-gray'}`}>
                                  {category.list.length}
                              </span>
                          </button>
                      )
                  })}
              </nav>
          </div>

          <div>
              <ServiceList 
                serviceList={serviceCategories[activeTab].list}
                onAdd={() => onAddNewService(activeTab)}
                addText={serviceCategories[activeTab].addText}
              />
          </div>
      </div>
    </div>
  );
};

export default Catalog;