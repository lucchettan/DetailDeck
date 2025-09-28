import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SuccessIcon, ImageIcon, CloseIcon, CheckCircleIcon, SparklesIcon, XCircleIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import Calendar from './Calendar';
import TimeSlotPicker from './TimeSlotPicker';
import { formatDuration, toCamelCase } from '../../lib/utils';
import StepClientInfo from './StepClientInfo';
import BookingPageSkeleton from './BookingPageSkeleton';
import ServiceSelectionCard from './ServiceSelectionCard';
import { ASSET_URLS } from '../../constants';

// Types simplifiés pour la nouvelle structure
interface Service {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  baseDuration: number;
  vehicleSizeVariations: Record<string, { price: number; duration: number }>;
  isActive: boolean;
  imageUrls: string[];
}

interface AddOn {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  serviceId: string;
}

interface Shop {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressCity: string;
  addressPostalCode: string;
  businessType: string;
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
  formulaName: string;
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
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [callbackInfo, setCallbackInfo] = useState({ name: '', phone: '' });

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

      // Charger les services (on retire temporairement la condition is_active pour debug)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('shop_id', shopId);

      if (servicesError) throw servicesError;

      // Charger les add-ons liés aux services (on retire temporairement la condition is_active pour debug)
      const { data: addOnsData, error: addOnsError } = await supabase
        .from('addons')
        .select('*')
        .eq('shop_id', shopId)
        .not('service_id', 'is', null);

      if (addOnsError) throw addOnsError;

      // Charger les tailles de véhicules
      const { data: vehicleSizesData, error: vehicleSizesError } = await supabase
        .from('shop_vehicle_sizes')
        .select('*')
        .eq('shop_id', shopId);

      if (vehicleSizesError) throw vehicleSizesError;

      // Charger les catégories de services (on retire temporairement la condition is_active pour debug)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('shop_service_categories')
        .select('*')
        .eq('shop_id', shopId);

      if (categoriesError) throw categoriesError;

      console.log('🔍 [DEBUG] Booking data loaded:', {
        shop: shop?.name,
        servicesCount: servicesData?.length || 0,
        servicesData,
        addOnsCount: addOnsData?.length || 0,
        vehicleSizesCount: vehicleSizesData?.length || 0,
        categoriesCount: categoriesData?.length || 0
      });

      setShopData(shop);
      setServices(toCamelCase(servicesData || []) as Service[]);
      setAddOns(toCamelCase(addOnsData || []) as AddOn[]);
      setVehicleSizes(toCamelCase(vehicleSizesData || []) as VehicleSize[]);
      setServiceCategories(toCamelCase(categoriesData || []) as ServiceCategory[]);

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
      const variation = service.vehicleSizeVariations?.[selectedVehicleSize] || { price: 0, duration: 0 };
      let servicePrice = service.basePrice + variation.price;
      let serviceDuration = service.baseDuration + variation.duration;

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
        basePrice: service.basePrice,
        variationPrice: variation.price,
        formulaPrice: formulaPrice,
        formulaName: selectedService.formulaId ? service.formulas?.find(f => f.name === selectedService.formulaId)?.name || selectedService.formulaId : '',
        totalPrice: itemTotalPrice,
        baseDuration: service.baseDuration,
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

  // Fonction pour créer une lead (demande de rappel)
  const handleCallbackRequest = async () => {
    if (!callbackInfo.name.trim() || !callbackInfo.phone.trim()) {
      alert('Veuillez remplir votre nom et téléphone');
      return;
    }

    try {
      setIsSubmitting(true);

      const cartDetails = selectedServices.map(selectedService => {
        const service = services.find(s => s.id === selectedService.serviceId);
        if (!service) return '';

        let details = `${service.name}`;
        if (selectedService.formulaId) {
          details += ` (Formule: ${selectedService.formulaId})`;
        }
        if (selectedService.addOnIds.length > 0) {
          const selectedAddOns = selectedService.addOnIds
            .map(id => addOns.find(a => a.id === id)?.name)
            .filter(Boolean);
          details += ` + Add-ons: ${selectedAddOns.join(', ')}`;
        }
        return details;
      }).filter(Boolean).join(' | ');

      // Structure simplifiée pour éviter les erreurs de colonnes
      const servicesText = selectedServices.map(selectedService => {
        const service = services.find(s => s.id === selectedService.serviceId);
        let text = service?.name || '';
        if (selectedService.formulaId) {
          text += ` (${selectedService.formulaId})`;
        }
        if (selectedService.addOnIds.length > 0) {
          const addOnNames = selectedService.addOnIds
            .map(id => addOns.find(a => a.id === id)?.name)
            .filter(Boolean);
          text += ` + ${addOnNames.join(', ')}`;
        }
        return text;
      }).join(' | ');

      const { error } = await supabase
        .from('leads')
        .insert({
          shop_id: shopId,
          client_phone: callbackInfo.phone,
          status: 'to_call',
          message: `RAPPEL - ${callbackInfo.name} - Services: ${servicesText} - Véhicule: ${vehicleSizes.find(vs => vs.id === selectedVehicleSize)?.name || 'Non spécifié'} - Total: ${totalCalculation.totalPrice.toFixed(2)}€`
        });

      if (error) throw error;

      alert('Votre demande de rappel a été envoyée ! Le professionnel vous contactera bientôt.');
      setShowCallbackForm(false);
      setCallbackInfo({ name: '', phone: '' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      alert('Erreur lors de l\'envoi de votre demande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Valider les informations client
  const validateClientInfo = () => {
    const errors: ClientInfoErrors = {};

    if (!clientInfo.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }

    if (!clientInfo.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }

    if (!clientInfo.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(clientInfo.email)) {
      errors.email = 'L\'email n\'est pas valide';
    }

    if (!clientInfo.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
    }

    setClientInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gérer la soumission de la réservation
  const handleReservationSubmit = async () => {
    if (!shopData || !selectedDate) return;

    // Valider les informations client
    if (!validateClientInfo()) {
      return;
    }

    setIsSubmitting(true);
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

      // Utiliser le créneau sélectionné ou un créneau par défaut
      const timeSlot = selectedTimeSlot || '14:00';
      const endTime = calculateEndTime(timeSlot, totalCalculation.totalDuration);

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
          start_time: timeSlot,
          end_time: endTime,
          total_price: totalCalculation.totalPrice,
          total_duration: totalCalculation.totalDuration,
          status: 'pending',
          // Structure JSONB pour les services
          services: selectedServices.map(selectedService => {
            const service = services.find(s => s.id === selectedService.serviceId);
            if (!service) return null;

            // Calculer le prix et la durée pour ce service
            const variation = service.vehicleSizeVariations?.[selectedVehicleSize] || { price: 0, duration: 0 };
            let servicePrice = service.basePrice + variation.price;
            let serviceDuration = service.baseDuration + variation.duration;

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
    } finally {
      setIsSubmitting(false);
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
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{shopData.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{shopData.addressCity}</span>
                  {shopData.businessType === 'mobile' && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      Service mobile
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {shopData.phone}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isCartExpanded ? 'pb-80' : 'pb-32'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Étapes */}
          <div>
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
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ← Retour
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Choisissez une catégorie</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    console.log('🔍 [DEBUG] Category matching:', {
                      totalCategories: serviceCategories.length,
                      totalServices: services.length,
                      categories: serviceCategories.map(c => ({ id: c.id, name: c.name })),
                      services: services.map(s => ({ id: s.id, name: s.name, categoryId: s.categoryId }))
                    });

                    const categoriesWithServices = serviceCategories.filter(category => {
                      const servicesInCategory = services.filter(service => service.categoryId === category.id);
                      console.log(`🔍 [DEBUG] Category "${category.name}" (${category.id}) has ${servicesInCategory.length} services`);
                      return servicesInCategory.length > 0;
                    });

                    if (categoriesWithServices.length === 0) {
                      return (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500 text-lg">Aucun service disponible pour le moment.</p>
                          <p className="text-gray-400 text-sm mt-2">Veuillez contacter le professionnel pour plus d'informations.</p>
                        </div>
                      );
                    }

                    return categoriesWithServices.map(category => {
                      const servicesInCategory = services.filter(service => service.categoryId === category.id);
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setCurrentStep('serviceSelection');
                          }}
                          className="p-4 border-2 rounded-lg text-left transition-colors border-gray-200 hover:border-gray-300"
                        >
                          <h3 className="font-semibold text-gray-900">
                            {category.name}
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({servicesInCategory.length} service{servicesInCategory.length > 1 ? 's' : ''})
                            </span>
                          </h3>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {currentStep === 'serviceSelection' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={() => setCurrentStep('categorySelection')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ← Retour
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Sélectionnez vos services</h2>
                </div>
                <div className="space-y-4">
                  {(() => {
                    const filteredServices = services.filter(service => service.categoryId === selectedCategory);
                    console.log('🔍 [DEBUG] Service filtering:', {
                      selectedCategory,
                      totalServices: services.length,
                      filteredServices: filteredServices.length,
                      allServices: services.map(s => ({ id: s.id, name: s.name, categoryId: s.categoryId })),
                      filteredServicesList: filteredServices.map(s => ({ id: s.id, name: s.name, categoryId: s.categoryId }))
                    });
                    return filteredServices.map(service => (
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
                    ));
                  })()}
                </div>
              </div>
            )}

            {currentStep === 'datetime' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={() => setCurrentStep('serviceSelection')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ← Retour
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
                    {selectedDate ? (
                      <TimeSlotPicker
                        selectedDate={selectedDate}
                        selectedTimeSlot={selectedTimeSlot}
                        onTimeSlotSelect={setSelectedTimeSlot}
                        shopId={shopId}
                        duration={totalCalculation.totalDuration}
                      />
                    ) : (
                      <div className="text-center p-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Veuillez d'abord sélectionner une date</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'clientInfo' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={() => setCurrentStep('datetime')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ← Retour
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Vos informations</h2>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        id="firstName"
                        value={clientInfo.firstName}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Votre prénom"
                        required
                      />
                      {clientInfoErrors.firstName && <p className="text-red-500 text-sm mt-1">{clientInfoErrors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        id="lastName"
                        value={clientInfo.lastName}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Votre nom"
                        required
                      />
                      {clientInfoErrors.lastName && <p className="text-red-500 text-sm mt-1">{clientInfoErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      id="email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="votre@email.com"
                      required
                    />
                    {clientInfoErrors.email && <p className="text-red-500 text-sm mt-1">{clientInfoErrors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      id="phone"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0123456789"
                      required
                    />
                    {clientInfoErrors.phone && <p className="text-red-500 text-sm mt-1">{clientInfoErrors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="vehicleInfo" className="block text-sm font-medium text-gray-700 mb-1">Informations véhicule</label>
                    <input
                      type="text"
                      id="vehicleInfo"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Marque, modèle, plaque d'immatriculation (optionnel)"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes supplémentaires</label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Instructions spéciales, localisation précise, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'confirmed' && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
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
        </div>
      </div>

      {/* Footer fixe avec résumé */}
      {totalCalculation.totalPrice > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          {/* Section expandable avec détail du panier */}
          {isCartExpanded && (
            <div className="border-b bg-gray-50 p-4">
              <div className="max-w-7xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Détail de votre réservation</h3>

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
                            <p>Taille: {item.vehicleSizeLabel} +{item.variationPrice}€</p>
                          )}
                          {item.formulaPrice > 0 && (
                            <p>Formule: {item.formulaName} +{item.formulaPrice}€</p>
                          )}
                        </div>
                        {item.addOns.length > 0 && (
                          <div className="mt-1">
                            {item.addOns.map(addOn => (
                              <p key={addOn.id} className="text-xs text-gray-500 ml-2">
                                Add-on: {addOn.name} ({addOn.price}€)
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Barre principale du footer */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Layout desktop : une seule ligne */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-6">
                  {selectedServices.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Services</p>
                      <p className="text-sm font-medium">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500">Durée totale</p>
                    <p className="text-sm font-medium">{formatDuration(totalCalculation.totalDuration)}</p>
                  </div>
                </div>

                {/* Bouton pour expander/réduire le détail - À GAUCHE */}
                <button
                  onClick={() => setIsCartExpanded(!isCartExpanded)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {isCartExpanded ? "Masquer le détail" : "Voir le détail"}
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-blue-600">
                    {totalCalculation.totalPrice.toFixed(2)}€
                  </p>
                </div>

                {/* Actions principales - TOUJOURS VISIBLES quand des services sont sélectionnés */}
                {selectedServices.length > 0 && (
                  <>
                    {/* Boutons pour les étapes intermédiaires */}
                    {currentStep !== 'clientInfo' && (
                      <button
                        onClick={() => setShowCallbackForm(true)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                      >
                        Être rappelé
                      </button>
                    )}

                    {currentStep === 'serviceSelection' && (
                      <button
                        onClick={() => setCurrentStep('datetime')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Réserver un RDV
                      </button>
                    )}

                    {currentStep === 'datetime' && selectedDate && (
                      <button
                        onClick={() => setCurrentStep('clientInfo')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Continuer
                      </button>
                    )}

                    {currentStep === 'datetime' && !selectedDate && (
                      <button
                        onClick={() => setCurrentStep('serviceSelection')}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                      >
                        Modifier services
                      </button>
                    )}

                    {/* Dernière étape - seulement le bouton de confirmation */}
                    {currentStep === 'clientInfo' && (
                      <button
                        onClick={handleReservationSubmit}
                        disabled={isSubmitting}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-lg"
                      >
                        {isSubmitting ? 'Envoi...' : 'Confirmer la réservation'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Layout mobile/tablet : deux stacks */}
            <div className="lg:hidden space-y-4">
              {/* Stack 1: Info du panier */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {selectedServices.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Services</p>
                      <p className="text-sm font-medium">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500">Durée</p>
                    <p className="text-sm font-medium">{formatDuration(totalCalculation.totalDuration)}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCartExpanded(!isCartExpanded)}
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {isCartExpanded ? "Masquer" : "Détail"}
                </button>
              </div>

              {/* Stack 2: Actions */}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-blue-600">
                    {totalCalculation.totalPrice.toFixed(2)}€
                  </p>
                </div>

                {selectedServices.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {currentStep !== 'clientInfo' && (
                      <button
                        onClick={() => setShowCallbackForm(true)}
                        className="bg-gray-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                      >
                        Être rappelé
                      </button>
                    )}

                    {currentStep === 'serviceSelection' && (
                      <button
                        onClick={() => setCurrentStep('datetime')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                      >
                        Réserver un RDV
                      </button>
                    )}

                    {currentStep === 'datetime' && selectedDate && (
                      <button
                        onClick={() => setCurrentStep('clientInfo')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                      >
                        Continuer
                      </button>
                    )}

                    {currentStep === 'datetime' && !selectedDate && (
                      <button
                        onClick={() => setCurrentStep('serviceSelection')}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                      >
                        Modifier services
                      </button>
                    )}

                    {currentStep === 'clientInfo' && (
                      <button
                        onClick={handleReservationSubmit}
                        disabled={isSubmitting}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        {isSubmitting ? 'Envoi...' : 'Confirmer'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale pour demande de rappel */}
      {showCallbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demande de rappel</h3>
            <p className="text-sm text-gray-600 mb-6">
              Laissez-nous vos coordonnées et nous vous rappellerons pour finaliser votre réservation.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="callbackName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="callbackName"
                  value={callbackInfo.name}
                  onChange={(e) => setCallbackInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre nom et prénom"
                  required
                />
              </div>

              <div>
                <label htmlFor="callbackPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="callbackPhone"
                  value={callbackInfo.phone}
                  onChange={(e) => setCallbackInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0123456789"
                  required
                />
              </div>

              {/* Résumé du panier */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Votre sélection :</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedVehicleSize && (
                    <p>• Véhicule : {vehicleSizes.find(vs => vs.id === selectedVehicleSize)?.name}</p>
                  )}
                  {selectedServices.map(selectedService => {
                    const service = services.find(s => s.id === selectedService.serviceId);
                    return service ? (
                      <p key={service.id}>• {service.name}</p>
                    ) : null;
                  })}
                  <p className="font-medium text-blue-600 pt-2">
                    Total : {totalCalculation.totalPrice.toFixed(2)}€
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCallbackForm(false);
                  setCallbackInfo({ name: '', phone: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCallbackRequest}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFlowNew;


