import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Service, Formula, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';
import { PlusIcon, TrashIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import { IS_MOCK_MODE } from '../../lib/env';

// Fonction pour formater la durée en XXhXXmn
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${remainingMinutes}min`;
};

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
    duration: number;
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
  const [vehicleSizeVariations, setVehicleSizeVariations] = useState<Record<string, Record<string, { price: number; duration: number }>>>({});
  const [serviceAddOns, setServiceAddOns] = useState<Record<string, Array<{ name: string; price: number; duration: number; description?: string }>>>({});
  const [loading, setLoading] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Fetch services and formulas
  useEffect(() => {
    const fetchData = async () => {
      if (IS_MOCK_MODE) {
        // Mock data
        const mockServices: Service[] = [
          {
            id: '1',
            name: 'Lavage Extérieur Complet',
            base_price: 25,
            base_duration: 60,
            category_id: serviceCategories[0]?.id || '',
            is_active: true
          },
          {
            id: '2',
            name: 'Nettoyage Intérieur Premium',
            base_price: 35,
            base_duration: 90,
            category_id: serviceCategories[1]?.id || '',
            is_active: true
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
            .eq('is_active', true);

          setServices(servicesData || []);

          // Load formulas from services table
          const formulasByService: Record<string, Formula[]> = {};
          servicesData?.forEach(service => {
            if (service.formulas && Array.isArray(service.formulas) && service.formulas.length > 0) {
              formulasByService[service.id] = service.formulas.map((formula: any, index: number) => ({
                id: formula.id || `formula_${index}`,
                name: formula.name || 'Formule',
                additionalPrice: formula.additionalPrice || 0,
                additionalDuration: formula.additionalDuration || 0,
                serviceId: service.id
              }));
            } else {
              // Formule par défaut si aucune formule n'est définie
              formulasByService[service.id] = [
                { id: 'default', name: 'Standard', additionalPrice: 0, additionalDuration: 0, serviceId: service.id }
              ];
            }
          });
          setFormulas(formulasByService);

          // Load vehicle size variations from services table
          const variationsByService: Record<string, Record<string, { price: number; duration: number }>> = {};

          servicesData?.forEach(service => {
            // Load vehicle size variations
            if (service.vehicle_size_variations && typeof service.vehicle_size_variations === 'object') {
              variationsByService[service.id] = service.vehicle_size_variations;
            }
          });

          // Load add-ons directly from addons table (simplified structure)
          const addOnsByService: Record<string, Array<{ name: string; price: number; duration: number; description?: string }>> = {};
          try {
            const { data: addonsData, error: addonsError } = await supabase
              .from('add_ons')
              .select('id, name, description, price, duration, service_id')
              .eq('is_active', true)
              .not('service_id', 'is', null);

            if (addonsError) {
              console.error('❌ Error loading add-ons:', addonsError);
            } else if (addonsData) {
              addonsData.forEach((addon: any) => {
                const serviceId = addon.service_id;
                if (!addOnsByService[serviceId]) {
                  addOnsByService[serviceId] = [];
                }

                addOnsByService[serviceId].push({
                  name: addon.name,
                  price: parseFloat(addon.price) || 0,
                  duration: addon.duration || 0,
                  description: addon.description || ''
                });
              });
            }
          } catch (error) {
            console.error('❌ Error loading add-ons:', error);
          }

          setVehicleSizeVariations(variationsByService);
          setServiceAddOns(addOnsByService);

          // Debug logs
          console.log('🔍 ServiceSelector loaded data:', {
            services: servicesData?.length || 0,
            formulas: Object.keys(formulasByService).length,
            vehicleSizeVariations: Object.keys(variationsByService).length,
            addOns: Object.keys(addOnsByService).length
          });
          console.log('📋 Formulas by service:', formulasByService);
          console.log('🚗 Vehicle size variations:', variationsByService);
          console.log('➕ Add-ons by service:', addOnsByService);
        } catch (error) {
          console.error('Error fetching services:', error);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const goBackToCategories = () => {
    setSelectedCategoryId(null);
  };

  // Fonction pour calculer le prix et la durée total d'un service
  const calculateServiceTotal = (service: SelectedService): { totalPrice: number; totalDuration: number } => {
    // Toujours recalculer depuis la base du service
    const baseService = services.find(s => s.id === service.serviceId);
    if (!baseService) {
      console.error('Service not found for calculation');
      return { totalPrice: 0, totalDuration: 0 };
    }

    let totalPrice = parseFloat(baseService.base_price) || 0;
    let totalDuration = parseInt(baseService.base_duration) || 0;

    console.log(`🧮 Calculating total for service ${service.serviceName}:`, {
      basePrice: totalPrice,
      baseDuration: totalDuration,
      formulaId: service.formulaId,
      vehicleSizeId: service.vehicleSizeId,
      addOns: service.addOns.length
    });

    // Ajouter le prix/durée de la formule
    if (service.formulaId && service.formulaId !== 'default') {
      const serviceFormulas = formulas[service.serviceId] || [];
      const selectedFormula = serviceFormulas.find(f => f.id === service.formulaId);
      console.log('📋 Formula calculation:', { serviceFormulas, selectedFormula });
      if (selectedFormula) {
        totalPrice += selectedFormula.additionalPrice || 0;
        totalDuration += selectedFormula.additionalDuration || 0;
        console.log(`➕ Added formula: +${selectedFormula.additionalPrice}€, +${selectedFormula.additionalDuration}min`);
      }
    }

    // Ajouter le prix/durée de la taille de véhicule
    const vehicleSizeVariation = vehicleSizeVariations[service.serviceId]?.[service.vehicleSizeId];
    console.log('🚗 Vehicle size calculation:', { vehicleSizeVariation });
    if (vehicleSizeVariation) {
      totalPrice += vehicleSizeVariation.price || 0;
      totalDuration += vehicleSizeVariation.duration || 0;
      console.log(`➕ Added vehicle size: +${vehicleSizeVariation.price}€, +${vehicleSizeVariation.duration}min`);
    }

    // Ajouter le prix/durée des add-ons sélectionnés
    service.addOns.forEach(addOn => {
      totalPrice += addOn.price || 0;
      totalDuration += addOn.duration || 0;
      console.log(`➕ Added add-on: +${addOn.price}€, +${addOn.duration}min`);
    });

    console.log(`🎯 Final totals: ${totalPrice}€, ${totalDuration}min`);
    return { totalPrice, totalDuration };
  };

  const addService = (serviceId: string) => {
    console.log('addService called', { services, vehicleSizes, serviceId });

    const firstVehicleSize = vehicleSizes[0]; // Use first available vehicle size
    if (!firstVehicleSize) {
      console.log('No active vehicle size found');
      return;
    }

    const service = services.find(s => s.id === serviceId);
    const category = serviceCategories.find(cat => cat.id === service?.category_id);

    if (!service || !category) {
      console.error('Service or category not found');
      return;
    }

    const newService: SelectedService = {
      serviceId: service.id,
      serviceName: service.name,
      categoryId: category.id,
      categoryName: category.name,
      vehicleSizeId: firstVehicleSize.id,
      vehicleSizeName: firstVehicleSize.name,
      basePrice: parseFloat(service.base_price) || 0,
      additionalPrice: 0,
      totalPrice: parseFloat(service.base_price) || 0,
      duration: parseInt(service.base_duration) || 0,
      addOns: []
    };

    // Calculer le prix et la durée total avec la taille de véhicule par défaut
    const { totalPrice, totalDuration } = calculateServiceTotal(newService);
    newService.totalPrice = totalPrice;
    newService.duration = totalDuration;

    onServicesChange([...selectedServices, newService]);
    setShowCategorySelection(false);
    setSelectedCategoryId(null);
  };

  const openCategorySelection = () => {
    setShowCategorySelection(true);
  };

  const removeService = (index: number) => {
    const updated = selectedServices.filter((_, i) => i !== index);
    onServicesChange(updated);
  };

  // Fonction pour gérer la sélection/désélection des add-ons
  const toggleAddOn = (serviceIndex: number, addOnName: string) => {
    const updated = [...selectedServices];
    const service = updated[serviceIndex];
    const existingAddOnIndex = service.addOns.findIndex(addOn => addOn.name === addOnName);

    if (existingAddOnIndex >= 0) {
      // Retirer l'add-on
      service.addOns.splice(existingAddOnIndex, 1);
    } else {
      // Ajouter l'add-on
      const availableAddOns = serviceAddOns[service.serviceId] || [];
      const addOnToAdd = availableAddOns.find(addOn => addOn.name === addOnName);
      if (addOnToAdd) {
        service.addOns.push({
          id: addOnName, // Utiliser le nom comme ID pour simplifier
          name: addOnToAdd.name,
          price: addOnToAdd.price,
          duration: addOnToAdd.duration || 0
        });
      }
    }

    // Recalculer le prix et la durée total
    const { totalPrice, totalDuration } = calculateServiceTotal(service);
    service.totalPrice = totalPrice;
    service.duration = totalDuration;

    onServicesChange(updated);
  };

  const updateService = (index: number, field: keyof SelectedService, value: any) => {
    const updated = [...selectedServices];
    updated[index] = { ...updated[index], [field]: value };

    // Debug log
    console.log(`🔄 Updating service ${index}, field: ${field}, value:`, value);

    // Recalculer le prix et la durée total
    const { totalPrice, totalDuration } = calculateServiceTotal(updated[index]);
    updated[index].totalPrice = totalPrice;
    updated[index].duration = totalDuration;

    console.log(`💰 New totals for service ${index}:`, { totalPrice, totalDuration });

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

    // Update vehicle size name when vehicle size changes
    if (field === 'vehicleSizeId') {
      const vehicleSize = vehicleSizes.find(vs => vs.id === value);
      if (vehicleSize) {
        updated[index].vehicleSizeName = vehicleSize.name;
      }
    }

    // Recalculate pricing when service, formula, or vehicle size changes
    if (field === 'serviceId' || field === 'formulaId' || field === 'vehicleSizeId') {
      const service = services.find(s => s.id === updated[index].serviceId);
      const formula = formulas[updated[index].serviceId]?.find(f => f.id === updated[index].formulaId);

      if (service) {
        updated[index].serviceName = service.name;
        updated[index].basePrice = parseFloat(service.base_price) || 0;
        // Get vehicle size supplement
        const variation = vehicleSizeVariations[service.id]?.[updated[index].vehicleSizeId];
        const vehicleSizePrice = variation?.price || 0;
        const vehicleSizeDuration = variation?.duration || 0;

        // Get formula supplement
        const formulaPrice = formula?.additionalPrice || 0;
        const formulaDuration = formula?.additionalDuration || 0;

        updated[index].additionalPrice = formulaPrice;
        updated[index].totalPrice = (parseFloat(service.base_price) || 0) + vehicleSizePrice + formulaPrice;
        updated[index].duration = (parseInt(service.base_duration) || 0) + vehicleSizeDuration + formulaDuration;

        if (formula) {
          updated[index].formulaName = formula.name;
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
          className="btn btn-secondary text-sm"
        >
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
              {selectedCategoryId ? (
                // Show services for selected category
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={goBackToCategories}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h4 className="font-semibold text-neutral-dark">
                      {serviceCategories.find(c => c.id === selectedCategoryId)?.name}
                    </h4>
                  </div>

                  {services
                    .filter(service => service.category_id === selectedCategoryId)
                    .map(service => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => addService(service.id)}
                        className="w-full card p-4 text-left hover:border-primary transition-colors border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-neutral-dark">{service.name}</h5>
                            <p className="text-sm text-gray-600">
                              {service.base_price}€ • {formatDuration(parseInt(service.base_duration) || 0)}
                            </p>
                          </div>
                          <div className="text-green-600 font-semibold">
                            + Ajouter
                          </div>
                        </div>
                      </button>
                    ))}
                </>
              ) : (
                // Show categories
                serviceCategories.map(category => {
                  const categoryServices = services.filter(s => s.category_id === category.id);
                  const categoryIcon = category.iconName === 'interior' ? '🏠' :
                    category.iconName === 'exterior' ? '✨' : '🔧';

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => selectCategory(category.id)}
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
                })
              )}
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
                      style={{ WebkitAppearance: 'none', appearance: 'none' }}
                    >
                      <option value="">Choisir un service</option>
                      {services
                        .filter(service => service.category_id === selectedService.categoryId)
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
                      style={{ WebkitAppearance: 'none', appearance: 'none' }}
                    >
                      <option value="">Formule de base</option>
                      {(formulas[selectedService.serviceId] || []).map(formula => (
                        <option key={formula.id} value={formula.id}>
                          {formula.name} {formula.additionalPrice > 0 ? `(+${formula.additionalPrice}€)` : ''} {formula.additionalDuration > 0 ? `(+${formula.additionalDuration}min)` : ''}
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
                      style={{ WebkitAppearance: 'none', appearance: 'none' }}
                    >
                      {vehicleSizes.map(size => {
                        const variation = vehicleSizeVariations[selectedService.serviceId]?.[size.id];
                        const additionalPrice = variation?.price || 0;
                        const additionalDuration = variation?.duration || 0;
                        return (
                          <option key={size.id} value={size.id}>
                            {size.name} {additionalPrice > 0 ? `(+${additionalPrice}€)` : ''} {additionalDuration > 0 ? `(+${additionalDuration}min)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                </div>

                {/* Add-ons Selection - Full width */}
                {serviceAddOns[selectedService.serviceId] && serviceAddOns[selectedService.serviceId].length > 0 && (
                  <div className="mt-4">
                    <label className="form-label">Add-ons disponibles</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {serviceAddOns[selectedService.serviceId].map((addOn, addOnIndex) => {
                        const isSelected = selectedService.addOns.some(selectedAddOn => selectedAddOn.name === addOn.name);
                        return (
                          <label key={addOnIndex} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAddOn(index, addOn.name)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-neutral-dark">{addOn.name}</div>
                              {addOn.description && (
                                <div className="text-sm text-gray-600">{addOn.description}</div>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-primary">
                              +{addOn.price}€
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-neutral-dark">{selectedService.totalPrice}€</span>
                  {' • '}
                  <span>{formatDuration(selectedService.duration)}</span>
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
                  {formatDuration(selectedServices.reduce((sum, s) => sum + s.duration, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default ServiceSelector;
