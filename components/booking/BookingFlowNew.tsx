import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SuccessIcon, ImageIcon, ChevronLeftIcon, StorefrontIcon, CloseIcon, CheckCircleIcon, PhoneIcon, SparklesIcon, ChevronUpIcon, XCircleIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import Calendar from './Calendar';
import TimeSlotPicker from './TimeSlotPicker';
import { formatDuration } from '../../lib/utils';
import StepClientInfo from './StepClientInfo';
import BookingPageSkeleton from './BookingPageSkeleton';
import ServiceSelectionCard from './ServiceSelectionCard';
import { ASSET_URLS } from '../../constants';

// Types simplifiés pour la nouvelle structure
interface Service {
  id: string;
  shop_id: string;
  category_id: string;
  name: string;
  description: string;
  base_price: number;
  base_duration: number;
  vehicle_size_variations: Record<string, { price: number; duration: number }>;
  is_active: boolean;
  image_urls: string[];
}

interface AddOn {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  is_active: boolean;
}

interface Shop {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_city: string;
  address_postal_code: string;
  business_type: string;
}

interface VehicleSize {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  is_active: boolean;
}

interface BookingPageProps {
  shopId: string;
}

type BookingStep = 'vehicleSize' | 'categorySelection' | 'serviceSelection' | 'datetime' | 'clientInfo' | 'confirmed' | 'leadSubmitted';

export interface SelectedService {
  serviceId: string;
  formulaId?: string; // ID de la formule sélectionnée (optionnel)
  addOnIds: string[];
}

export interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ClientInfoErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  vehicle?: string;
}

interface DetailsBreakdownItem {
  serviceId: string;
  serviceName: string;
  vehicleSizeLabel: string;
  basePrice: number;
  variationPrice: number;
  formulaPrice: number;
  totalPrice: number;
  baseDuration: number;
  variationDuration: number;
  formulaDuration: number;
  totalDuration: number;
  addOns: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
}

const BookingFlowNew: React.FC<BookingPageProps> = ({ shopId }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<BookingStep>('vehicleSize');
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedVehicleSize, setSelectedVehicleSize] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [clientInfoErrors, setClientInfoErrors] = useState<ClientInfoErrors>({});
  const [reservationId, setReservationId] = useState<string>('');

  // Charger les données du shop
  useEffect(() => {
    loadShopData();
  }, [shopId]);

  const loadShopData = async () => {
    setLoading(true);
    try {
      // Charger les données du shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (shopError) throw shopError;

      // Charger les services actifs
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      // Charger les add-ons liés aux services (nouvelle structure)
      const { data: addOnsData, error: addOnsError } = await supabase
        .from('addons')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .not('service_id', 'is', null);

      if (addOnsError) throw addOnsError;

      // Charger les tailles de véhicules
      const { data: vehicleSizesData, error: vehicleSizesError } = await supabase
        .from('shop_vehicle_sizes')
        .select('*')
        .eq('shop_id', shopId);

      if (vehicleSizesError) throw vehicleSizesError;

      // Charger les catégories de services
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('shop_service_categories')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      setShopData(shop);
      setServices(servicesData || []);
      setAddOns(addOnsData || []);
      setVehicleSizes(vehicleSizesData || []);
      setServiceCategories(categoriesData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculer le prix total et la durée totale
  const totalCalculation = useMemo(() => {
    if (!selectedVehicleSize || selectedServices.length === 0) {
      return { totalPrice: 0, totalDuration: 0, breakdown: [] };
    }

    const breakdown: DetailsBreakdownItem[] = [];
    let totalPrice = 0;
    let totalDuration = 0;

    selectedServices.forEach(selectedService => {
      const service = services.find(s => s.id === selectedService.serviceId);
      if (!service) return;

      // Prix et durée de base du service
      const variation = service.vehicle_size_variations[selectedVehicleSize] || { price: 0, duration: 0 };
      let servicePrice = service.base_price + variation.price;
      let serviceDuration = service.base_duration + variation.duration;

      // Ajouter le prix et la durée de la formule si sélectionnée
      let formulaPrice = 0;
      let formulaDuration = 0;
      if (selectedService.formulaId && service.formulas) {
        const formula = service.formulas.find(f => f.name === selectedService.formulaId);
        if (formula) {
          formulaPrice = formula.additionalPrice || 0;
          formulaDuration = formula.additionalDuration || 0;
        }
      }

      // Ajouter les add-ons spécifiques au service
      const serviceAddOns = selectedService.addOnIds
        .map(addOnId => addOns.find(a => a.id === addOnId))
        .filter(Boolean) as AddOn[];

      const addOnsPrice = serviceAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
      const addOnsDuration = serviceAddOns.reduce((sum, addOn) => sum + addOn.duration, 0);

      const itemTotalPrice = servicePrice + formulaPrice + addOnsPrice;
      const itemTotalDuration = serviceDuration + formulaDuration + addOnsDuration;

      totalPrice += itemTotalPrice;
      totalDuration += itemTotalDuration;

      breakdown.push({
        serviceId: service.id,
        serviceName: service.name,
        vehicleSizeLabel: vehicleSizes.find(vs => vs.id === selectedVehicleSize)?.name || '',
        basePrice: service.base_price,
        variationPrice: variation.price,
        formulaPrice: formulaPrice,
        totalPrice: itemTotalPrice,
        baseDuration: service.base_duration,
        variationDuration: variation.duration,
        formulaDuration: formulaDuration,
        totalDuration: itemTotalDuration,
        addOns: serviceAddOns.map(addOn => ({
          id: addOn.id,
          name: addOn.name,
          price: addOn.price,
          duration: addOn.duration
        }))
      });
    });

    return { totalPrice, totalDuration, breakdown };
  }, [selectedServices, selectedVehicleSize, services, addOns, vehicleSizes]);

  // Gérer la sélection d'un service
  const handleServiceSelect = (serviceId: string, addOnIds: string[] = [], formulaId?: string) => {
    const existingIndex = selectedServices.findIndex(s => s.serviceId === serviceId);

    if (existingIndex >= 0) {
      // Mettre à jour le service existant
      const updated = [...selectedServices];
      updated[existingIndex] = { serviceId, addOnIds, formulaId };
      setSelectedServices(updated);
    } else {
      // Ajouter un nouveau service
      setSelectedServices([...selectedServices, { serviceId, addOnIds, formulaId }]);
    }
  };

  // Gérer la suppression d'un service
  const handleServiceRemove = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
  };

  // Gérer la soumission de la réservation
  const handleReservationSubmit = async () => {
    if (!shopData || !selectedDate || !selectedTimeSlot) return;

    try {
      // Calculer l'heure de fin
      const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + durationMinutes;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      };

      const endTime = calculateEndTime(selectedTimeSlot, totalCalculation.totalDuration);

      // Créer la réservation avec la nouvelle structure JSONB
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          shop_id: shopId,
          customer_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
          customer_email: clientInfo.email,
          customer_phone: clientInfo.phone,
          vehicle_size_id: selectedVehicleSize,
          date: selectedDate.toISOString().split('T')[0],
          start_time: selectedTimeSlot,
          end_time: endTime,
          total_price: totalCalculation.totalPrice,
          total_duration: totalCalculation.totalDuration,
          status: 'pending',
          // Structure JSONB pour les services
          services: selectedServices.map(selectedService => {
            const service = services.find(s => s.id === selectedService.serviceId);
            if (!service) return null;

            // Calculer le prix et la durée pour ce service
            const variation = service.vehicle_size_variations[selectedVehicleSize] || { price: 0, duration: 0 };
            let servicePrice = service.base_price + variation.price;
            let serviceDuration = service.base_duration + variation.duration;

            // Ajouter la formule si sélectionnée
            if (selectedService.formulaId && service.formulas) {
              const formula = service.formulas.find(f => f.name === selectedService.formulaId);
              if (formula) {
                servicePrice += formula.additionalPrice || 0;
                serviceDuration += formula.additionalDuration || 0;
              }
            }

            // Ajouter les add-ons
            const serviceAddOns = selectedService.addOnIds
              .map(addOnId => addOns.find(a => a.id === addOnId))
              .filter(Boolean) as AddOn[];

            const addOnsPrice = serviceAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
            const addOnsDuration = serviceAddOns.reduce((sum, addOn) => sum + addOn.duration, 0);

            return {
              serviceId: service.id,
              serviceName: service.name,
              formulaId: selectedService.formulaId,
              vehicleSizeId: selectedVehicleSize,
              addOns: serviceAddOns.map(addOn => ({
                id: addOn.id,
                name: addOn.name,
                price: addOn.price,
                duration: addOn.duration
              })),
              totalPrice: servicePrice + addOnsPrice,
              duration: serviceDuration + addOnsDuration
            };
          }).filter(Boolean)
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      setReservationId(reservation.id);
      setCurrentStep('confirmed');

    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
    }
  };

  // Gérer la soumission du lead
  const handleLeadSubmit = async () => {
    if (!shopData) return;

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          shop_id: shopId,
          customer_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
          customer_email: clientInfo.email,
          customer_phone: clientInfo.phone,
          vehicle_size_id: selectedVehicleSize,
          message: `Demande de devis pour: ${selectedServices.map(s => {
            const service = services.find(serv => serv.id === s.serviceId);
            return service?.name || '';
          }).join(', ')}`
        });

      if (error) throw error;

      setCurrentStep('leadSubmitted');

    } catch (error) {
      console.error('Erreur lors de la soumission du lead:', error);
    }
  };

  if (loading) {
    return <BookingPageSkeleton />;
  }

  if (!shopData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop non trouvé</h2>
          <p className="text-gray-600">Le shop demandé n'existe pas ou n'est pas accessible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <StorefrontIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{shopData.name}</h1>
                <p className="text-sm text-gray-600">{shopData.address_city}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <PhoneIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{shopData.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panneau de gauche - Étapes */}
          <div className="lg:col-span-2">
            {currentStep === 'vehicleSize' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sélectionnez la taille de votre véhicule</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicleSizes.map(vehicleSize => (
                    <button
                      key={vehicleSize.id}
                      onClick={() => {
                        setSelectedVehicleSize(vehicleSize.id);
                        setCurrentStep('categorySelection');
                      }}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${selectedVehicleSize === vehicleSize.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          🚗
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{vehicleSize.name}</h3>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'categorySelection' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={() => setCurrentStep('vehicleSize')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Choisissez une catégorie</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setCurrentStep('serviceSelection');
                      }}
                      className="p-4 border-2 rounded-lg text-left transition-colors border-gray-200 hover:border-gray-300"
                    >
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'serviceSelection' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={() => setCurrentStep('categorySelection')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Sélectionnez vos services</h2>
                </div>
                <div className="space-y-4">
                  {services
                    .filter(service => service.category_id === selectedCategory)
                    .map(service => (
                      <ServiceSelectionCard
                        key={service.id}
                        service={service}
                        vehicleSize={vehicleSizes.find(vs => vs.id === selectedVehicleSize)}
                        addOns={addOns}
                        selectedAddOns={selectedServices.find(s => s.serviceId === service.id)?.addOnIds || []}
                        selectedFormula={selectedServices.find(s => s.serviceId === service.id)?.formulaId}
                        onSelect={(addOnIds, formulaId) => handleServiceSelect(service.id, addOnIds, formulaId)}
                        onRemove={() => handleServiceRemove(service.id)}
                        isSelected={selectedServices.some(s => s.serviceId === service.id)}
                      />
                    ))}
                </div>
                {selectedServices.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setCurrentStep('datetime')}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Continuer vers la réservation
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'datetime' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={() => setCurrentStep('serviceSelection')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Choisissez votre créneau</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Date</h3>
                    <Calendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      shopId={shopId}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Heure</h3>
                    <TimeSlotPicker
                      selectedDate={selectedDate}
                      selectedTimeSlot={selectedTimeSlot}
                      onTimeSlotSelect={setSelectedTimeSlot}
                      shopId={shopId}
                      duration={totalCalculation.totalDuration}
                    />
                  </div>
                </div>
                {selectedDate && selectedTimeSlot && (
                  <div className="mt-6">
                    <button
                      onClick={() => setCurrentStep('clientInfo')}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Continuer vers vos informations
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'clientInfo' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={() => setCurrentStep('datetime')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Vos informations</h2>
                </div>
                <StepClientInfo
                  clientInfo={clientInfo}
                  setClientInfo={setClientInfo}
                  clientInfoErrors={clientInfoErrors}
                  setClientInfoErrors={setClientInfoErrors}
                  onSubmit={handleReservationSubmit}
                  onLeadSubmit={handleLeadSubmit}
                />
              </div>
            )}

            {currentStep === 'confirmed' && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <SuccessIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Réservation confirmée !</h2>
                <p className="text-gray-600 mb-4">
                  Votre réservation a été enregistrée avec succès.
                </p>
                <p className="text-sm text-gray-500">
                  ID de réservation: {reservationId}
                </p>
              </div>
            )}

            {currentStep === 'leadSubmitted' && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <SparklesIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
                <p className="text-gray-600 mb-4">
                  Votre demande de devis a été transmise au shop.
                </p>
                <p className="text-sm text-gray-500">
                  Vous recevrez une réponse dans les plus brefs délais.
                </p>
              </div>
            )}
          </div>

          {/* Panneau de droite - Résumé */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de votre réservation</h3>

              {selectedVehicleSize && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Véhicule:</p>
                  <p className="font-medium">{vehicleSizes.find(vs => vs.id === selectedVehicleSize)?.name}</p>
                </div>
              )}

              {selectedServices.length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-gray-600">Services sélectionnés:</p>
                  {totalCalculation.breakdown.map((item, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-3">
                      <p className="font-medium text-sm">{item.serviceName}</p>
                      <p className="text-xs text-gray-500">
                        {item.totalPrice}€ • {formatDuration(item.totalDuration)}
                      </p>
                      <div className="text-xs text-gray-500 ml-2">
                        <p>Base: {item.basePrice}€</p>
                        {item.variationPrice > 0 && (
                          <p>+ Taille: {item.variationPrice}€</p>
                        )}
                        {item.formulaPrice > 0 && (
                          <p>+ Formule: {item.formulaPrice}€</p>
                        )}
                      </div>
                      {item.addOns.length > 0 && (
                        <div className="mt-1">
                          {item.addOns.map(addOn => (
                            <p key={addOn.id} className="text-xs text-gray-500 ml-2">
                              + {addOn.name} ({addOn.price}€)
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {totalCalculation.totalPrice > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {totalCalculation.totalPrice.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Durée totale:</span>
                    <span>{formatDuration(totalCalculation.totalDuration)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlowNew;


