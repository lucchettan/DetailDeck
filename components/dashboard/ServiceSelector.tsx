import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Service, Formula, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';
import { PlusIcon, TrashIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import { IS_MOCK_MODE } from '../../lib/env';

interface SelectedService {
  serviceId: string;
  serviceName: string;
  categoryId?: string;
  categoryName?: string;
  formulaId?: string;
  formulaName?: string;
  vehicleSizeId: string;
  vehicleSizeName: string;
  basePrice: number;
  additionalPrice: number;
  totalPrice: number;
  duration: number;
  addOns: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface ServiceSelectorProps {
  shopId: string;
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  vehicleSizes: ShopVehicleSize[];
  serviceCategories: ShopServiceCategory[];
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  shopId,
  selectedServices,
  onServicesChange,
  vehicleSizes,
  serviceCategories
}) => {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [formulas, setFormulas] = useState<Record<string, Formula[]>>({});
  const [loading, setLoading] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);

  // Fetch services and formulas
  useEffect(() => {
    const fetchData = async () => {
      if (IS_MOCK_MODE) {
        // Mock data
        const mockServices: Service[] = [
          {
            id: '1',
            name: 'Lavage Extérieur Complet',
            basePrice: 25,
            baseDuration: 60,
            categoryId: 'exterior',
            status: 'active'
          },
          {
            id: '2',
            name: 'Nettoyage Intérieur Premium',
            basePrice: 35,
            baseDuration: 90,
            categoryId: 'interior',
            status: 'active'
          }
        ];
        setServices(mockServices);

        // Mock formulas
        setFormulas({
          '1': [
            { id: 'f1', name: 'Standard', additionalPrice: 0, additionalDuration: 0, serviceId: '1' },
            { id: 'f2', name: 'Premium', additionalPrice: 10, additionalDuration: 15, serviceId: '1' }
          ],
          '2': [
            { id: 'f3', name: 'Standard', additionalPrice: 0, additionalDuration: 0, serviceId: '2' },
            { id: 'f4', name: 'Deluxe', additionalPrice: 15, additionalDuration: 30, serviceId: '2' }
          ]
        });
      } else {
        setLoading(true);
        try {
          // Fetch services
          const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'active');

          // Fetch formulas
          const { data: formulasData } = await supabase
            .from('formulas')
            .select('*')
            .in('service_id', servicesData?.map(s => s.id) || []);

          setServices(servicesData || []);

          // Group formulas by service ID
          const formulasByService: Record<string, Formula[]> = {};
          formulasData?.forEach(formula => {
            if (!formulasByService[formula.service_id]) {
              formulasByService[formula.service_id] = [];
            }
            formulasByService[formula.service_id].push(formula);
          });
          setFormulas(formulasByService);
        } catch (error) {
          console.error('Error fetching services:', error);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  const addService = (categoryId?: string) => {
    console.log('addService called', { services, vehicleSizes, categoryId });

    const firstVehicleSize = vehicleSizes.find(v => v.isActive);

    if (!firstVehicleSize) {
      console.log('No active vehicle size found');
      return;
    }

    const category = serviceCategories.find(cat => cat.id === categoryId);

    const newService: SelectedService = {
      serviceId: '',
      serviceName: '',
      categoryId: categoryId || '',
      categoryName: category?.name || '',
      vehicleSizeId: firstVehicleSize.id,
      vehicleSizeName: firstVehicleSize.name,
      basePrice: 0,
      additionalPrice: 0,
      totalPrice: 0,
      duration: 0,
      addOns: []
    };

    onServicesChange([...selectedServices, newService]);
    setShowCategorySelection(false);
  };

  const openCategorySelection = () => {
    setShowCategorySelection(true);
  };

  const removeService = (index: number) => {
    const updated = selectedServices.filter((_, i) => i !== index);
    onServicesChange(updated);
  };

  const updateService = (index: number, field: keyof SelectedService, value: any) => {
    const updated = [...selectedServices];
    updated[index] = { ...updated[index], [field]: value };

    // Update category name
    if (field === 'categoryId') {
      const category = serviceCategories.find(c => c.id === value);
      if (category) {
        updated[index].categoryName = category.name;
      }
      // Reset service when category changes
      updated[index].serviceId = '';
      updated[index].serviceName = '';
      updated[index].formulaId = undefined;
      updated[index].formulaName = undefined;
      updated[index].basePrice = 0;
      updated[index].additionalPrice = 0;
      updated[index].totalPrice = 0;
      updated[index].duration = 0;
    }

    // Recalculate pricing when service or formula changes
    if (field === 'serviceId' || field === 'formulaId') {
      const service = services.find(s => s.id === updated[index].serviceId);
      const formula = formulas[updated[index].serviceId]?.find(f => f.id === updated[index].formulaId);

      if (service) {
        updated[index].serviceName = service.name;
        updated[index].basePrice = service.basePrice;
        updated[index].duration = service.baseDuration;
        updated[index].additionalPrice = formula?.additionalPrice || 0;
        updated[index].totalPrice = service.basePrice + (formula?.additionalPrice || 0);

        if (formula) {
          updated[index].formulaName = formula.name;
          updated[index].duration += formula.additionalDuration || 0;
        } else {
          updated[index].formulaName = undefined;
        }
      }
    }

    // Update vehicle size name
    if (field === 'vehicleSizeId') {
      const vehicleSize = vehicleSizes.find(v => v.id === value);
      if (vehicleSize) {
        updated[index].vehicleSizeName = vehicleSize.name;
      }
    }

    onServicesChange(updated);
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des services...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-neutral-dark">Services sélectionnés</h4>
        <button
          type="button"
          onClick={openCategorySelection}
          className="btn btn-secondary flex items-center gap-2 text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Ajouter un service
        </button>
      </div>

      {/* Category Selection Modal */}
      {showCategorySelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-dark">Choisir une catégorie</h3>
              <button
                onClick={() => setShowCategorySelection(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {serviceCategories.filter(cat => cat.isActive).map(category => {
                const categoryServices = services.filter(s => s.categoryId === category.id);
                const categoryIcon = category.iconName === 'interior' ? '🏠' :
                  category.iconName === 'exterior' ? '✨' : '🔧';

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => addService(category.id)}
                    disabled={categoryServices.length === 0}
                    className="w-full card p-4 text-left hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{categoryIcon}</div>
                      <div>
                        <h5 className="font-semibold text-neutral-dark">{category.name}</h5>
                        <p className="text-sm text-gray-600">
                          {categoryServices.length} service{categoryServices.length > 1 ? 's' : ''} disponible{categoryServices.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedServices.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          Aucun service sélectionné
        </div>
      ) : (
        <div className="space-y-4">
          {selectedServices.map((selectedService, index) => (
            <div key={index} className="card p-4 border border-gray-200">
              <div className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {selectedService.categoryId === 'interior' ? '🏠' :
                        selectedService.categoryId === 'exterior' ? '✨' : '🔧'}
                    </span>
                    <span className="font-semibold text-neutral-dark">
                      {selectedService.categoryName}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Service Selection */}
                  <div>
                    <label className="form-label">Service</label>
                    <select
                      value={selectedService.serviceId}
                      onChange={(e) => updateService(index, 'serviceId', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Choisir un service</option>
                      {services
                        .filter(service => service.categoryId === selectedService.categoryId)
                        .map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Formula Selection */}
                  <div>
                    <label className="form-label">Formule</label>
                    <select
                      value={selectedService.formulaId || ''}
                      onChange={(e) => updateService(index, 'formulaId', e.target.value || undefined)}
                      className="form-input"
                      disabled={!selectedService.serviceId}
                    >
                      <option value="">Formule de base</option>
                      {(formulas[selectedService.serviceId] || []).map(formula => (
                        <option key={formula.id} value={formula.id}>
                          {formula.name} (+{formula.additionalPrice}€)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicle Size Selection */}
                  <div>
                    <label className="form-label">Taille véhicule</label>
                    <select
                      value={selectedService.vehicleSizeId}
                      onChange={(e) => updateService(index, 'vehicleSizeId', e.target.value)}
                      className="form-input"
                    >
                      {vehicleSizes.filter(v => v.isActive).map(size => (
                        <option key={size.id} value={size.id}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-neutral-dark">{selectedService.totalPrice}€</span>
                  {' • '}
                  <span>{selectedService.duration}min</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}


          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <div>
                <span className="text-neutral-dark">
                  {selectedServices.reduce((sum, s) => sum + s.totalPrice, 0)}€
                </span>
                {' • '}
                <span className="text-gray-600">
                  {selectedServices.reduce((sum, s) => sum + s.duration, 0)}min
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
