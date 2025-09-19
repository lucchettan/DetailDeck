import React, { useState, useMemo, useEffect } from 'react';
import { Service, Shop, AddOn } from './Dashboard';
import { useLanguage } from '../contexts/LanguageContext';
import { SuccessIcon, ImageIcon, ChevronLeftIcon, StorefrontIcon, MapPinIcon, PhoneIcon } from './Icons';
import { supabase } from '../lib/supabaseClient';
import Calendar from './booking/Calendar';
import TimeSlotPicker from './booking/TimeSlotPicker';
import FloatingSummary from './booking/FloatingSummary';
import { toCamelCase, parseSafeInt } from '../lib/utils';
import BookingForm from './booking/BookingForm';
import StepClientInfo from './booking/StepClientInfo';
import BookingPageSkeleton from './booking/BookingPageSkeleton';

interface BookingPageProps {
  shopId: string;
}

type FullShopData = Shop & { services: Service[], addOns: AddOn[] };

type BookingStep = 'selection' | 'datetime' | 'clientInfo' | 'confirmed';
export type VehicleSize = 'S' | 'M' | 'L' | 'XL';

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

const BookingPage: React.FC<BookingPageProps> = ({ shopId }) => {
    const { t } = useLanguage();
    
    const [step, setStep] = useState<BookingStep>('selection');
    const [shopData, setShopData] = useState<FullShopData | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    // Step 1 State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedVehicleSize, setSelectedVehicleSize] = useState<VehicleSize | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
    
    // Step 2 State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    
    // Step 3 State
    const [clientVehicle, setClientVehicle] = useState('');
    const [clientInfo, setClientInfo] = useState<ClientInfo>({ firstName: '', lastName: '', email: '', phone: '' });
    const [clientInfoErrors, setClientInfoErrors] = useState<ClientInfoErrors>({});
    const [specialInstructions, setSpecialInstructions] = useState('');
    
    useEffect(() => {
        const fetchShopData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 1. Fetch shop
                const { data: shop, error: shopError } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('id', shopId)
                    .single();

                if (shopError) {
                    if (shopError.code === 'PGRST116') {
                        throw new Error(t.shopNotFound);
                    }
                    throw shopError;
                }
                
                if (!shop) {
                    throw new Error(t.shopNotFound);
                }

                // 2. Fetch services
                const { data: services, error: servicesError } = await supabase
                    .from('services')
                    .select('*')
                    .eq('shop_id', shop.id);
                
                if (servicesError) throw servicesError;

                // 3. Fetch add-ons
                const { data: addOns, error: addOnsError } = await supabase
                    .from('add_ons')
                    .select('*')
                    .eq('shop_id', shop.id);
                
                if (addOnsError) throw addOnsError;
                
                // 4. Combine and set state
                const fullShopData: FullShopData = {
                    ...(toCamelCase(shop) as Shop),
                    services: toCamelCase(services) as Service[],
                    addOns: toCamelCase(addOns) as AddOn[],
                };

                setShopData(fullShopData);

            } catch (e: any) {
                console.error("Error fetching shop data:", e);
                setError(`${t.errorLoadingShop}\n\n${e.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchShopData();
    }, [shopId, t]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const availableAddOns = useMemo((): AddOn[] => {
        if (!selectedService || !shopData?.addOns) return [];
        
        // Global add-ons have no serviceId but match the shopId
        const global = shopData.addOns.filter(addOn => !addOn.serviceId);

        // Specific add-ons are linked directly to the service
        const specific = shopData.addOns.filter(addOn => addOn.serviceId === selectedService.id);

        // Specific add-ons should probably appear first.
        return [...specific, ...global];
    }, [selectedService, shopData]);


    const { totalDuration, totalPrice } = useMemo(() => {
        if (!selectedService) return { totalDuration: 0, totalPrice: 0 };
        
        let duration = 0;
        let price = 0;

        if (selectedService.varies) {
            if (selectedVehicleSize) {
                duration = parseSafeInt(selectedService.pricing[selectedVehicleSize]?.duration);
                price = parseSafeInt(selectedService.pricing[selectedVehicleSize]?.price);
            }
        } else {
            duration = parseSafeInt(selectedService.singlePrice?.duration);
            price = parseSafeInt(selectedService.singlePrice?.price);
        }

        const addOnMap = new Map(availableAddOns.map(a => [a.id, a]));
        selectedAddOns.forEach(addOnId => {
            const addOn = addOnMap.get(addOnId);
            if (addOn) {
                duration += parseSafeInt(addOn.duration);
                price += parseSafeInt(addOn.price);
            }
        });
        
        return { totalDuration: duration, totalPrice: price };
    }, [selectedService, selectedVehicleSize, selectedAddOns, availableAddOns]);

    const toggleAddOn = (addOnId: string) => {
        setSelectedAddOns(prev => {
            const newSet = new Set(prev);
            newSet.has(addOnId) ? newSet.delete(addOnId) : newSet.add(addOnId);
            return newSet;
        });
    };
    
     const handleSelectService = (service: Service | null) => {
        if (service?.id === selectedService?.id) {
            setSelectedService(null);
            setSelectedVehicleSize(null);
            setSelectedAddOns(new Set());
        } else {
            setSelectedService(service);
            setSelectedVehicleSize(null);
            setSelectedAddOns(new Set());
        }
    };

    const validateClientInfo = () => {
        const errors: ClientInfoErrors = {};
        // FIX: Use 'fieldIsRequired' translation key.
        if (!clientVehicle.trim()) errors.vehicle = t.fieldIsRequired;
        // FIX: Use 'fieldIsRequired' translation key.
        if (!clientInfo.firstName.trim()) errors.firstName = t.fieldIsRequired;
        // FIX: Use 'fieldIsRequired' translation key.
        if (!clientInfo.lastName.trim()) errors.lastName = t.fieldIsRequired;
        if (!clientInfo.email.trim()) {
            // FIX: Use 'fieldIsRequired' translation key.
            errors.email = t.fieldIsRequired;
        } else if (!/^\S+@\S+\.\S+$/.test(clientInfo.email)) {
            errors.email = t.emailValidationError;
        }
        // FIX: Use 'fieldIsRequired' translation key.
        if (!clientInfo.phone.trim()) errors.phone = t.fieldIsRequired;
        setClientInfoErrors(errors);
        return Object.keys(errors).length === 0;
    }

    const handleConfirmBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime || !shopData) return;

        setIsConfirming(true);
        setError(null);

        const addOnMap = new Map(availableAddOns.map(a => [a.id, a]));
        const confirmedAddOns = Array.from(selectedAddOns).map(id => {
            const addOn = addOnMap.get(id);
            return { id: addOn?.id, name: addOn?.name, price: addOn?.price, duration: addOn?.duration };
        }).filter(a => a.name);
        
        const { error: insertError } = await supabase.from('reservations').insert({
            shop_id: shopId,
            service_id: selectedService.id,
            date: selectedDate.toISOString().split('T')[0],
            start_time: selectedTime,
            duration: totalDuration,
            price: totalPrice,
            client_name: `${clientInfo.firstName} ${clientInfo.lastName}`,
            client_email: clientInfo.email,
            client_phone: clientInfo.phone,
            payment_status: 'on_site',
            status: 'upcoming',
            service_details: {
                name: selectedService.name,
                vehicleSize: selectedVehicleSize,
                addOns: confirmedAddOns,
                client_vehicle: clientVehicle,
                special_instructions: specialInstructions,
            }
        });
        
        if (insertError) {
            console.error("Booking error:", insertError);
            setError(t.bookingFailed);
            setIsConfirming(false);
            return;
        } 
        
        setStep('confirmed');
        setIsConfirming(false);
    };

    const handleNextStep = () => {
        if (step === 'selection') {
            setStep('datetime');
        } else if (step === 'datetime') {
            setStep('clientInfo');
        } else if (step === 'clientInfo') {
            if (validateClientInfo()) {
                handleConfirmBooking();
            }
        }
    }

    const handlePrevStep = () => {
        if (step === 'datetime') setStep('selection');
        if (step === 'clientInfo') setStep('datetime');
    }

    const resetBooking = () => {
        setStep('selection');
        setClientVehicle('');
        setSelectedService(null);
        setSelectedVehicleSize(null);
        setSelectedAddOns(new Set());
        setSpecialInstructions('');
        setSelectedDate(null);
        setSelectedTime(null);
        setClientInfo({ firstName: '', lastName: '', email: '', phone: '' });
        setClientInfoErrors({});
        setError(null);
    };

    const getConfirmationMessage = () => {
        if (!selectedService || !selectedDate || !selectedTime) return '';

        const vehicleText = selectedVehicleSize ? t.forVehicle.replace('{vehicleSize}', t[`size_${selectedVehicleSize}`]) : '';
        
        const addOnMap = new Map(availableAddOns.map(a => [a.id, a]));
        const addOnsList = Array.from(selectedAddOns)
            .map(id => addOnMap.get(id)?.name)
            .filter(Boolean)
            .join(', ');
            
        const addOnsText = addOnsList ? t.withAddOns.replace('{addOnsList}', addOnsList) : '';

        const formattedDate = selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        return t.bookingConfirmationMessage
            .replace('{serviceName}', selectedService.name)
            .replace('{vehicleText}', vehicleText)
            .replace('{addOnsText}', addOnsText)
            .replace('{date}', formattedDate)
            .replace('{time}', selectedTime)
            .replace('{price}', totalPrice.toString());
    };
    
    if (loading) return <BookingPageSkeleton />;
    if (error || !shopData) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p className="text-brand-gray whitespace-pre-wrap">{error || t.errorLoadingShop}</p></div>;

    const activeServices = shopData.services?.filter(s => s.status === 'active') || [];

    const renderContent = () => {
        if (step === 'confirmed') {
            const messageParts = getConfirmationMessage().split('**');

            return (
                <div className="bg-white p-6 rounded-lg shadow-md text-center py-12 max-w-2xl mx-auto">
                    <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.bookingConfirmed}</h2>
                    <p className="text-brand-gray max-w-md mx-auto mb-6">
                        {messageParts.map((part, index) => 
                            index % 2 === 1 ? <strong key={index} className="text-brand-dark">{part}</strong> : part
                        )}
                        <br/><br/>
                        {t.bookingConfirmationDetails}
                    </p>
                    <button onClick={resetBooking} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all">
                        {t.bookAnotherService}
                    </button>
                </div>
            )
        }
        
        if (step === 'datetime') {
             return (
                <div className="max-w-4xl mx-auto">
                    <button onClick={handlePrevStep} className="flex items-center gap-2 font-semibold text-brand-gray hover:text-brand-dark mb-4">
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span>{t.back}</span>
                    </button>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectDate}</h3>
                                <Calendar 
                                    shopId={shopId}
                                    schedule={shopData.schedule} 
                                    serviceDuration={totalDuration} 
                                    selectedDate={selectedDate} 
                                    onSelectDate={setSelectedDate}
                                    minBookingNotice={shopData.minBookingNotice}
                                    maxBookingHorizon={shopData.maxBookingHorizon}
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectTime}</h3>
                                { selectedDate ? <TimeSlotPicker shopId={shopId} schedule={shopData.schedule} serviceDuration={totalDuration} selectedDate={selectedDate} selectedTime={selectedTime} onSelectTime={setSelectedTime} />
                                : <p className="text-sm text-brand-gray">{t.selectDate}</p>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        
        if (step === 'clientInfo') {
            return (
                 <div className="max-w-2xl mx-auto">
                    <button onClick={handlePrevStep} className="flex items-center gap-2 font-semibold text-brand-gray hover:text-brand-dark mb-4">
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span>{t.back}</span>
                    </button>
                    <StepClientInfo 
                        clientInfo={clientInfo} 
                        setClientInfo={setClientInfo}
                        errors={clientInfoErrors}
                        specialInstructions={specialInstructions}
                        onSpecialInstructionsChange={setSpecialInstructions}
                        clientVehicle={clientVehicle}
                        onClientVehicleChange={(value) => {
                            setClientVehicle(value);
                            if (clientInfoErrors.vehicle) {
                                setClientInfoErrors(prev => ({...prev, vehicle: undefined}));
                            }
                        }}
                    />
                 </div>
            )
        }

        return (
            <div className="max-w-4xl mx-auto">
                <BookingForm
                    services={activeServices}
                    availableAddOns={availableAddOns}
                    selectedService={selectedService}
                    onSelectService={handleSelectService}
                    selectedVehicleSize={selectedVehicleSize}
                    onSelectVehicleSize={setSelectedVehicleSize}
                    selectedAddOns={selectedAddOns}
                    onToggleAddOn={toggleAddOn}
                />
            </div>
        )
    }

    const buttonDisabled = () => {
        if (step === 'selection' && (!selectedService || (selectedService.varies && !selectedVehicleSize))) return true;
        if (step === 'datetime' && !selectedTime) return true;
        if (step === 'clientInfo' && isConfirming) return true;
        return false;
    }

    const getButtonText = () => {
        switch(step) {
            case 'selection': return t.continueToDateTime;
            case 'datetime': return t.continueToYourInfo;
            case 'clientInfo': return t.confirmBooking;
            default: return '';
        }
    };

    return (
        <div className="bg-brand-light min-h-screen font-sans">
             <header className="relative h-48 bg-gray-800">
                {shopData.shopImageUrl ? (
                    <img src={shopData.shopImageUrl} alt={shopData.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ImageIcon className="w-16 h-16 text-gray-300" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
                <div className="absolute top-0 left-0 right-0 p-6 md:p-8 container mx-auto text-white">
                    <div className="flex items-center gap-3">
                        <StorefrontIcon className="w-8 h-8 flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />
                        <h1 className="text-3xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{shopData.name}</h1>
                    </div>
                    <div className="mt-2 space-y-1 pl-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                        {shopData.address && (
                            <p className="flex items-center gap-2 text-sm">
                                <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{shopData.address}</span>
                            </p>
                        )}
                        {shopData.phone && (
                            <p className="flex items-center gap-2 text-sm">
                                <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{shopData.phone}</span>
                            </p>
                        )}
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-8">
                {renderContent()}
            </main>

            {step !== 'confirmed' && selectedService && (
                <FloatingSummary
                    totalDuration={totalDuration}
                    totalPrice={totalPrice}
                    onButtonClick={handleNextStep}
                    buttonText={getButtonText()}
                    buttonDisabled={buttonDisabled()}
                    isConfirming={isConfirming}
                />
            )}
        </div>
    );
};

export default BookingPage;