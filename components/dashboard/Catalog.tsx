
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface CatalogProps {
  onEditService: (serviceId: string | null) => void;
}

// Mock data until we connect to backend
const mockServices = [
  { id: '1', name: 'Premium Interior Cleaning', description: 'Deep clean of all interior surfaces.', status: 'active', price: '150' },
  { id: '2', name: 'Exterior Wash & Wax', description: 'Hand wash, clay bar, and wax.', status: 'active', price: '120' },
  { id: '3', name: 'Ceramic Coating Prep', description: 'Full paint correction for coating application.', status: 'inactive', price: '500' },
];


const Catalog: React.FC<CatalogProps> = ({ onEditService }) => {
  const { t } = useLanguage();
  const [services, setServices] = useState(mockServices);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-brand-dark">{t.manageServices}</h2>
            <p className="text-brand-gray mt-1">{t.manageServicesSubtitle}</p>
        </div>
         <button 
            onClick={() => onEditService(null)}
            className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
            {t.addNewService}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Service Card - No longer needed as button is in header */}
        
        {/* Service Cards */}
        {services.map(service => (
          <div 
            key={service.id} 
            onClick={() => onEditService(service.id)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-brand-blue border border-transparent transition-all duration-300 cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-brand-dark">{service.name}</h3>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {t[service.status as 'active' | 'inactive']}
              </span>
            </div>
            <p className="text-brand-gray mt-2 text-sm h-10">{service.description}</p>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xl font-bold text-brand-dark">€{service.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalog;
