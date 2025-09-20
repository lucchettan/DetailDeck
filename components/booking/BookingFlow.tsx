
import React, { useState, useMemo, useEffect } from 'react';
import { Service, Shop, AddOn, Formula, VehicleSizeSupplement } from '../Dashboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { SuccessIcon, ImageIcon, ChevronLeftIcon, StorefrontIcon, MapPinIcon, PhoneIcon, CarIcon, CloseIcon, CheckCircleIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import Calendar from './Calendar';
import TimeSlotPicker from './TimeSlotPicker';
import FloatingSummary from './FloatingSummary';
import { toCamelCase, parseSafeInt } from '../../lib/utils';
import StepClientInfo from './StepClientInfo';
import BookingPageSkeleton from './BookingPageSkeleton';
import BookingServiceCard from './BookingServiceCard';

interface BookingPageProps {
  shopId: string;
}

type FullShopData = Shop & { 
    services: Service[], 
    addOns: AddOn[],
    formulas: Formula[],
    supplements: VehicleSizeSupplement[],
};

type BookingStep = 'vehicleSize' | 'exterior' | 'interior' | 'complementary' | 'datetime' | 'clientInfo' | 'confirmed';

export interface SelectedService {
    serviceId: string;
    formulaId: string;
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

const BookingFlow: React.FC<BookingPageProps> = ({ shopId }) => {
    const { t } = useLanguage();
    
    const [step, setStep] = useState<BookingStep>('vehicleSize');
    const [shopData, setShopData] = useState<FullShopData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    // Cart state
    const [selectedVehicleSize, setSelectedVehicleSize] = useState<string | null>(null);
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

    const [currentServiceForFormula, setCurrentServiceForFormula] = useState<Service | null>(null);
    const [showFormulaModal, setShowFormulaModal] = useState(false);
    
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clientVehicle, setClientVehicle] = useState('');
    const [clientInfo, setClientInfo] = useState<ClientInfo>({ firstName: '', lastName: '', email: '', phone: '' });
    const [clientInfoErrors, setClientInfoErrors] = useState<ClientInfoErrors>({});
    const [specialInstructions, setSpecialInstructions] = useState('');
    
    useEffect(() => {
        const fetchShopData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const { data: shop, error: shopError } = await supabase.from('shops').select('*').eq('id', shopId).single();
                if (shopError) throw shopError.code === 'PGRST116' ? new Error(t.shopNotFound) : shopError;

                // Step 1: Fetch active services for the shop
                const { data: services, error: servicesError } = await supabase
                    .from('services')
                    .select('*')
                    .eq('shop_id', shop.id)
                    .eq('status', 'active');
                if (servicesError) throw servicesError;

                const serviceIds = services.map(s => s.id);

                // Step 2: Fetch related items using service IDs
                const [addOnsRes, formulasRes, supplementsRes] = await Promise.all([
                    supabase.from('add_ons').select('*').eq('shop_id', shop.id),
                    serviceIds.length > 0 ? supabase.from('formulas').select('*').in('service_id', serviceIds) : Promise.resolve({ data: [], error: null }),
                    serviceIds.length > 0 ? supabase.from('service_vehicle_size_supplements').select('*').in('service_id', serviceIds) : Promise.resolve({ data: [], error: null })
                ]);

                if (addOnsRes.error || formulasRes.error || supplementsRes.error) {
                    throw new Error("Failed to load service details.");
                }

                setShopData({
                    ...(toCamelCase(shop) as Shop),
                    services: toCamelCase(services) as Service[],
                    addOns: toCamelCase(addOnsRes.data) as AddOn[],
                    formulas: toCamelCase(formulasRes.data) as Formula[],
                    supplements: toCamelCase(supplementsRes.data) as VehicleSizeSupplement[],
                });

            } catch (e: any) {
                console.error("Error fetching shop data:", e);
                setError(`${t.errorLoadingShop}: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchShopData();
    }, [shopId, t]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const { totalDuration, totalPrice } = useMemo(() => {
        let duration = 0;
        let price = 0;

        if (!shopData || !selectedVehicleSize) return { totalDuration: 0, totalPrice: 0 };
        
        const serviceMap = new Map(shopData.services.map(s => [s.id, s]));
        const formulaMap = new Map(shopData.formulas.map(f => [f.id, f]));
        const addOnMap = new Map(shopData.addOns.map(a => [a.id, a]));
        const supplementMap = new Map(shopData.supplements.map(s => [`${s.serviceId}-${s.size}`, s]));

        selectedServices.forEach(sel => {
            const service = serviceMap.get(sel.serviceId);
            const formula = formulaMap.get(sel.formulaId);
            if (!service || !formula) return;

            price += service.basePrice + formula.additionalPrice;
            duration += service.baseDuration + formula.additionalDuration;
            
            const supplement = supplementMap.get(`${service.id}-${selectedVehicleSize}`);
            if (supplement) {
                price += supplement.additionalPrice;
                duration += supplement.additionalDuration;
            }

            sel.addOnIds.forEach(addOnId => {
                const addOn = addOnMap.get(addOnId);
                if (addOn) {
                    price += parseSafeInt(addOn.price as any);
                    duration += parseSafeInt(addOn.duration as any);
                }
            });
        });
        
        return { totalDuration: duration, totalPrice: price };
    }, [selectedServices, selectedVehicleSize, shopData]);


    const handleServiceClick = (service: Service) => {
        const formulas = shopData?.formulas.filter(f => f.serviceId === service.id) || [];
        if (formulas.length > 1) {
            setCurrentServiceForFormula(service);
            setShowFormulaModal(true);
        } else {
            const defaultFormula = formulas[0];
            if (defaultFormula) {
                 setSelectedServices(prev => {
                     const isSelected = prev.some(s => s.serviceId === service.id);
                     if(isSelected) return prev.filter(s => s.serviceId !== service.id);
                     return [...prev, { serviceId: service.id, formulaId: defaultFormula.id, addOnIds: [] }];
                 });
            }
        }
    };
    
    const handleFormulaSelect = (formulaId: string) => {
        if (!currentServiceForFormula) return;
        setSelectedServices(prev => {
            const others = prev.filter(s => s.serviceId !== currentServiceForFormula.id);
            return [...others, { serviceId: currentServiceForFormula.id, formulaId, addOnIds: [] }];
        });
        setShowFormulaModal(false);
        setCurrentServiceForFormula(null);
    }
    
    const handleNextStep = () => {
        const steps: BookingStep[] = ['vehicleSize', 'exterior', 'interior', 'complementary', 'datetime', 'clientInfo', 'confirmed'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        } else if (step === 'clientInfo') {
            handleConfirmBooking();
        }
    };

    const handlePrevStep = () => {
        const steps: BookingStep[] = ['vehicleSize', 'exterior', 'interior', 'complementary', 'datetime', 'clientInfo'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    }
    
    const validateClientInfo = () => {
        const errors: ClientInfoErrors = {};
        if (!clientVehicle.trim()) errors.vehicle = t.fieldIsRequired;
        if (!clientInfo.firstName.trim()) errors.firstName = t.fieldIsRequired;
        if (!clientInfo.lastName.trim()) errors.lastName = t.fieldIsRequired;
        if (!clientInfo.email.trim()) {
            errors.email = t.fieldIsRequired;
        } else if (!/^\S+@\S+\.\S+$/.test(clientInfo.email)) {
            errors.email = t.emailValidationError;
        }
        if (!clientInfo.phone.trim()) errors.phone = t.fieldIsRequired;
        setClientInfoErrors(errors);
        return Object.keys(errors).length === 0;
    }

     const handleConfirmBooking = async () => {
        if (!validateClientInfo()) return;
        if (!selectedServices.length || !selectedDate || !selectedTime || !shopData || !selectedVehicleSize) return;

        setIsConfirming(true);
        setError(null);
        
        const serviceMap = new Map(shopData.services.map(s => [s.id, s]));
        const formulaMap = new Map(shopData.formulas.map(f => [f.id, f]));

        const { error: insertError } = await supabase.from('reservations').insert({
            shop_id: shopId,
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
                vehicleSize: selectedVehicleSize,
                clientVehicle: clientVehicle,
                specialInstructions: specialInstructions,
                services: selectedServices.map(s => ({
                    serviceId: s.serviceId,
                    serviceName: serviceMap.get(s.serviceId)?.name,
                    formulaId: s.formulaId,
                    formulaName: formulaMap.get(s.formulaId)?.name,
                    addOns: [] // Add-on logic can be added here
                }))
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

    if (loading) return <BookingPageSkeleton />;
    if (error || !shopData) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p className="text-brand-gray whitespace-pre-wrap">{error || t.errorLoadingShop}</p></div>;

    const fullAddress = [shopData.addressLine1, shopData.addressCity, shopData.addressPostalCode, shopData.addressCountry].filter(Boolean).join(', ');

    const stepTitles: Record<BookingStep, string> = {
        vehicleSize: t.selectVehicleSize,
        exterior: t.selectExteriorServices,
        interior: t.selectInteriorServices,
        complementary: t.selectComplementaryServices,
        datetime: t.selectDateTime,
        clientInfo: t.yourInformation,
        confirmed: t.bookingConfirmed,
    };

    const renderServiceCategoryStep = (category: 'exterior' | 'interior' | 'complementary') => {
        const services = shopData.services.filter(s => s.category === category);
        if (services.length === 0) {
            handleNextStep();
            return null; // Skip rendering if no services in category
        }
        return (
            <div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service, index) => (
                        <BookingServiceCard
                            key={service.id}
                            service={service}
                            isSelected={selectedServices.some(s => s.serviceId === service.id)}
                            onSelect={() => handleServiceClick(service)}
                            index={index}
                        />
                    ))}
                 </div>
            </div>
        );
    }

    const renderContent = () => {
        switch(step) {
            case 'vehicleSize':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        {shopData.supportedVehicleSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => {setSelectedVehicleSize(size); handleNextStep();}}
                                className="p-4 rounded-lg border-2 text-center transition-all duration-200 flex flex-col justify-center items-center h-32 bg-white hover:border-brand-blue hover:shadow-lg"
                            >
                                <CarIcon className="w-10 h-10 text-brand-dark mb-2"/>
                                <p className="font-bold text-brand-dark">{t[`size_${size as 'S'|'M'|'L'|'XL'}`]}</p>
                            </button>
                        ))}
                    </div>
                );
            case 'exterior': return renderServiceCategoryStep('exterior');
            case 'interior': return renderServiceCategoryStep('interior');
            case 'complementary': return renderServiceCategoryStep('complementary');
            case 'datetime': return (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectDate}</h3>
                            <Calendar 
                                shopId={shopId} schedule={shopData.schedule || {}} serviceDuration={totalDuration} 
                                selectedDate={selectedDate} onSelectDate={setSelectedDate}
                                minBookingNotice={shopData.minBookingNotice} maxBookingHorizon={shopData.maxBookingHorizon}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectTime}</h3>
                            { selectedDate ? <TimeSlotPicker 
                                                shopId={shopId} 
                                                schedule={shopData.schedule || {}} 
                                                serviceDuration={totalDuration} 
                                                selectedDate={selectedDate} 
                                                selectedTime={selectedTime} 
                                                onSelectTime={setSelectedTime} 
                                                minBookingNotice={shopData.minBookingNotice}
                                            />
                            : <p className="text-sm text-brand-gray">{t.selectDate}</p>
                            }
                        </div>
                    </div>
                </div>
            );
            case 'clientInfo': return (
                <StepClientInfo 
                    clientInfo={clientInfo} setClientInfo={setClientInfo}
                    errors={clientInfoErrors}
                    specialInstructions={specialInstructions} onSpecialInstructionsChange={setSpecialInstructions}
                    clientVehicle={clientVehicle} onClientVehicleChange={setClientVehicle}
                />
            );
            case 'confirmed': return (
                 <div className="bg-white p-6 rounded-lg shadow-md text-center py-12 max-w-2xl mx-auto">
                    <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.bookingConfirmed}</h2>
                    <p className="text-brand-gray max-w-md mx-auto mb-6">{t.bookingConfirmationDetails}</p>
                    <button onClick={() => window.location.reload()} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all">
                        {t.bookAnotherService}
                    </button>
                </div>
            )
            default: return null;
        }
    }

    const buttonDisabled = () => {
        if (step === 'datetime' && !selectedTime) return true;
        if (step === 'clientInfo' && isConfirming) return true;
        return false;
    }

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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                 <div className="absolute top-0 left-0 right-0 p-6 md:p-8 container mx-auto text-white">
                    <div className="flex items-center gap-3">
                        <StorefrontIcon className="w-8 h-8 flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />
                        <h1 className="text-3xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{shopData.name}</h1>
                    </div>
                 </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-8 max-w-4xl">
                 {step !== 'confirmed' && (
                    <div className="mb-6">
                        {step !== 'vehicleSize' && (
                           <button onClick={handlePrevStep} className="flex items-center gap-2 font-semibold text-brand-gray hover:text-brand-dark mb-4">
                                <ChevronLeftIcon className="w-5 h-5" />
                                <span>{t.back}</span>
                            </button>
                        )}
                        <h2 className="text-2xl font-bold text-brand-dark">{stepTitles[step]}</h2>
                    </div>
                 )}
                {renderContent()}
            </main>

            {step !== 'confirmed' && step !== 'vehicleSize' && (
                <FloatingSummary
                    totalDuration={totalDuration}
                    totalPrice={totalPrice}
                    onButtonClick={step === 'clientInfo' ? handleConfirmBooking : handleNextStep}
                    buttonText={step === 'clientInfo' ? t.confirmBooking : t.nextStep}
                    buttonDisabled={buttonDisabled()}
                    isConfirming={isConfirming}
                />
            )}

            {showFormulaModal && currentServiceForFormula && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <header className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-bold text-brand-dark">{t.chooseFormula}</h2>
                            <button onClick={() => setShowFormulaModal(false)}><CloseIcon/></button>
                        </header>
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {(shopData.formulas.filter(f => f.serviceId === currentServiceForFormula.id)).map(formula => (
                                <button key={formula.id} onClick={() => handleFormulaSelect(formula.id)} className="w-full text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-brand-blue">
                                    <div className="flex justify-between">
                                        <span className="font-bold">{formula.name}</span>
                                        <span className="font-semibold text-brand-blue">+ {formula.additionalPrice}€</span>
                                    </div>
                                     {formula.description && (
                                        <ul className="mt-2 text-sm text-brand-gray space-y-1 text-left">
                                            {formula.description.split('\n').map((item, index) => (
                                                item.trim() && <li key={index} className="flex items-start gap-2">
                                                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span>{item.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingFlow;
