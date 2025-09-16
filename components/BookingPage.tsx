
import React, { useState, useMemo, useEffect } from 'react';
// Fix: Import the 'Reservation' type from the Dashboard component to resolve the type error.
import { Service, Shop, Reservation } from './Dashboard';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckIcon, SuccessIcon, ChevronLeftIcon, CreditCardIcon, CarIcon, CalendarIcon as CalendarIconSolid } from './Icons';
import { supabase } from '../lib/supabaseClient';

// New Booking Flow Components
import BookingStepper from './booking/BookingStepper';
import ServiceCard from './booking/ServiceCard';
import Calendar from './booking/Calendar';
import TimeSlotPicker from './booking/TimeSlotPicker';

interface BookingPageProps {
  shopId: string;
}

interface ExistingReservation {
    start_time: string;
    duration: number;
}

type FullShopData = Shop & { services: Service[] };

type BookingStep = 'service' | 'size' | 'addons' | 'datetime' | 'details' | 'confirmed';
type VehicleSize = 'S' | 'M' | 'L' | 'XL';
type PaymentOption = 'deposit' | 'full';

const BookingPage: React.FC<BookingPageProps> = ({ shopId }) => {
    const { t } = useLanguage();
    
    // Core State
    const [step, setStep] = useState<BookingStep>('service');
    const [shopData, setShopData] = useState<FullShopData | null>(null);
    const [reservations, setReservations] = useState<ExistingReservation[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [loadingReservations, setLoadingReservations] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    // Step State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedVehicleSize, setSelectedVehicleSize] = useState<VehicleSize | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<Set<number>>(new Set());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
    const [paymentOption, setPaymentOption] = useState<PaymentOption>('full');
    const [formErrors, setFormErrors] = useState<{name?: string; email?: string; phone?: string}>({});

    // --- Data Fetching ---
    useEffect(() => {
        const fetchShopData = async () => {
            setLoading(true);
            setError(null);
            
            const { data, error: dbError } = await supabase
                .from('shops')
                .select('*, services(*)')
                .eq('id', shopId)
                .single();

            if (dbError || !data) {
                console.error("Error fetching shop data:", dbError);
                setError(t.shopNotFound);
            } else {
                setShopData(data as FullShopData);
            }
            setLoading(false);
        };
        fetchShopData();
    }, [shopId, t.shopNotFound]);

    useEffect(() => {
        if (!selectedDate || !shopData) return;
        const fetchReservations = async () => {
            setLoadingReservations(true);
            const dateString = selectedDate.toISOString().split('T')[0];
            const { data, error: dbError } = await supabase
                .from('reservations')
                .select('start_time, duration')
                .eq('shop_id', shopData.id)
                .eq('date', dateString);
            
            if (dbError) console.error("Error fetching reservations:", dbError);
            else setReservations(data as ExistingReservation[]);
            setLoadingReservations(false);
        };
        fetchReservations();
    }, [selectedDate, shopData]);

    // --- Derived State & Calculations ---
    const { totalDuration, totalPrice } = useMemo(() => {
        if (!selectedService) return { totalDuration: 0, totalPrice: 0 };
        
        let duration = 0;
        let price = 0;

        if (selectedService.varies) {
            if (selectedVehicleSize) {
                duration = parseInt(selectedService.pricing[selectedVehicleSize]?.duration || '0');
                price = parseInt(selectedService.pricing[selectedVehicleSize]?.price || '0');
            }
        } else {
            duration = parseInt(selectedService.singlePrice?.duration || '0');
            price = parseInt(selectedService.singlePrice?.price || '0');
        }

        selectedAddOns.forEach(addOnId => {
            const addOn = selectedService.addOns.find(a => a.id === addOnId);
            if (addOn) {
                duration += parseInt(addOn.duration);
                price += parseInt(addOn.price);
            }
        });
        
        return { totalDuration: duration, totalPrice: price };
    }, [selectedService, selectedVehicleSize, selectedAddOns]);

    const amountToPay = paymentOption === 'deposit' ? parseFloat(shopData?.bookingFee || '0') : totalPrice;

    // --- Navigation Logic ---
    const getNextStep = (current: BookingStep): BookingStep => {
        if (!selectedService) return 'service';
        switch (current) {
            case 'service':
                return selectedService.varies ? 'size' : (selectedService.addOns?.length > 0 ? 'addons' : 'datetime');
            case 'size':
                return selectedService.addOns?.length > 0 ? 'addons' : 'datetime';
            case 'addons':
                return 'datetime';
            case 'datetime':
                return 'details';
            default:
                return 'service';
        }
    };
    
    const getPreviousStep = (current: BookingStep): BookingStep => {
        if (!selectedService) return 'service';
         switch (current) {
            case 'details': return 'datetime';
            case 'datetime':
                if (selectedService.addOns?.length > 0) return 'addons';
                return selectedService.varies ? 'size' : 'service';
            case 'addons':
                return selectedService.varies ? 'size' : 'service';
            case 'size':
                return 'service';
            default: return 'service';
        }
    };

    const handleNext = () => setStep(getNextStep(step));
    const handleBack = () => {
        const prevStep = getPreviousStep(step);
        // Reset future steps' state when going back
        if (prevStep === 'addons' || prevStep === 'size' || prevStep === 'service') {
            setSelectedDate(null);
            setSelectedTime(null);
        }
        setStep(prevStep);
    };

    // --- Event Handlers ---
    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        // Reset dependent state
        setSelectedVehicleSize(null);
        setSelectedAddOns(new Set());
        setSelectedDate(null);
        setSelectedTime(null);
        setStep(getNextStep('service'));
    };

    const toggleAddOn = (addOnId: number) => {
        setSelectedAddOns(prev => {
            const newSet = new Set(prev);
            newSet.has(addOnId) ? newSet.delete(addOnId) : newSet.add(addOnId);
            return newSet;
        });
    };

    const validateDetailsStep = () => {
        const errors: {name?: string; email?: string; phone?: string} = {};
        if (!clientInfo.name.trim()) errors.name = t.fieldIsRequired;
        if (!clientInfo.email.trim()) errors.email = t.fieldIsRequired;
        else if (!/^\S+@\S+\.\S+$/.test(clientInfo.email)) errors.email = t.emailValidationError;
        if (!clientInfo.phone.trim()) errors.phone = t.fieldIsRequired;
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    const handleConfirmBooking = async () => {
        if (!validateDetailsStep()) return;
        setIsConfirming(true);
        setError(null);

        const paymentStatusMap: Record<PaymentOption, Reservation['paymentStatus']> = {
            deposit: 'pending_deposit',
            full: 'paid'
        };

        const { error: insertError } = await supabase.from('reservations').insert({
            shop_id: shopId,
            service_id: selectedService?.id,
            date: selectedDate?.toISOString().split('T')[0],
            start_time: selectedTime,
            duration: totalDuration,
            price: totalPrice,
            client_name: clientInfo.name,
            client_email: clientInfo.email,
            client_phone: clientInfo.phone,
            payment_status: paymentStatusMap[paymentOption],
            service_details: {
                name: selectedService?.name,
                vehicleSize: selectedVehicleSize,
                addOns: selectedService?.addOns.filter(a => selectedAddOns.has(a.id))
            }
        });

        setIsConfirming(false);
        if (insertError) {
            console.error("Booking error:", insertError);
            setError(t.bookingFailed);
        } else {
            setStep('confirmed');
        }
    };

    const resetBooking = () => {
        setStep('service');
        setSelectedService(null);
        // ... reset all other state
    };
    
    // --- Render Logic ---
    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div></div>;
    if (error || !shopData) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p className="text-brand-gray">{error || t.errorLoadingShop}</p></div>;

    const activeServices = shopData.services.filter(s => s.status === 'active');
    
    const stepperSteps = [
        { id: 'service', name: t.stepperService, icon: <CreditCardIcon/> },
        ...(selectedService?.varies ? [{ id: 'size', name: t.stepperVehicle, icon: <CarIcon/> }] : []),
        ...(selectedService?.addOns && selectedService.addOns.length > 0 ? [{ id: 'addons', name: t.stepperOptions, icon: <CheckIcon/> }] : []),
        { id: 'datetime', name: t.stepperDateTime, icon: <CalendarIconSolid/> },
        { id: 'details', name: t.stepperConfirmation, icon: <CheckIcon/> }
    ];

    return (
        <div className="bg-brand-light min-h-screen font-sans">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
                <div className="container mx-auto flex items-center gap-4">
                     <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {shopData.shopImageUrl && <img src={shopData.shopImageUrl} alt={shopData.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark">{shopData.name}</h1>
                        <p className="text-brand-gray">{shopData.address}</p>
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-8">
            
             {step !== 'confirmed' && (
                <div className="mb-8">
                    <BookingStepper steps={stepperSteps} currentStepId={step} />
                </div>
             )}

            {step === 'service' && (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.bookingStep1}</h2>
                    {activeServices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeServices.map(service => (
                                <ServiceCard key={service.id} service={service} onSelect={() => handleSelectService(service)} />
                            ))}
                        </div>
                    ) : <p className="text-brand-gray bg-white p-6 rounded-lg shadow-md">{t.noServicesAvailable}</p>}
                </div>
            )}
            
            {step === 'size' && selectedService?.varies && (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.selectVehicleSize}</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto space-y-3">
                        {Object.entries(selectedService.pricing).filter(([, details]) => details.enabled).map(([size, details]) => (
                            <button key={size} onClick={() => { setSelectedVehicleSize(size as VehicleSize); handleNext(); }} className="w-full text-left p-4 border rounded-lg bg-white hover:border-brand-blue flex justify-between items-center transition-all">
                                <div>
                                    <p className="font-bold">{t[`size_${size as 'S'|'M'|'L'|'XL'}`]}</p>
                                    <p className="text-sm text-brand-gray">{details.duration} min</p>
                                </div>
                                <p className="font-bold text-lg">€{details.price}</p>
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 text-center"><button onClick={handleBack} className="font-semibold text-brand-blue hover:underline">{t.back}</button></div>
                </div>
            )}

            {step === 'addons' && selectedService && selectedService.addOns.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.selectAddOns}</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto space-y-3">
                        {selectedService.addOns.map(addOn => (
                            <button key={addOn.id} onClick={() => toggleAddOn(addOn.id)} className={`w-full text-left p-4 border rounded-lg flex justify-between items-center transition-all ${selectedAddOns.has(addOn.id) ? 'border-brand-blue ring-2 ring-brand-blue' : 'hover:border-gray-400'}`}>
                                <div className="flex items-center">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center mr-4 flex-shrink-0 ${selectedAddOns.has(addOn.id) ? 'bg-brand-blue' : 'border-2'}`}>
                                        {selectedAddOns.has(addOn.id) && <CheckIcon className="w-4 h-4 text-white" />}
                                    </div>
                                    <div>
                                        <p className="font-bold">{addOn.name}</p>
                                        <p className="text-sm text-brand-gray">{addOn.duration} min</p>
                                    </div>
                                </div>
                                <p className="font-bold text-lg">€{addOn.price}</p>
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-center items-center gap-6">
                        <button onClick={handleBack} className="font-semibold text-brand-blue hover:underline">{t.back}</button>
                        <button onClick={handleNext} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600">{t.nextStep}</button>
                    </div>
                </div>
            )}

            {step === 'datetime' && selectedService && (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.bookingStep2}</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectDate}</h3>
                                <Calendar schedule={shopData.schedule} serviceDuration={totalDuration} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectTime}</h3>
                                {loadingReservations && <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div></div>}
                                {!loadingReservations && selectedDate && <TimeSlotPicker schedule={shopData.schedule} serviceDuration={totalDuration} selectedDate={selectedDate} selectedTime={selectedTime} onSelectTime={setSelectedTime} existingReservations={reservations} />}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-center items-center gap-6">
                        <button onClick={handleBack} className="font-semibold text-brand-blue hover:underline">{t.back}</button>
                        <button onClick={handleNext} disabled={!selectedTime} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">{t.nextStep}</button>
                    </div>
                </div>
            )}

            {step === 'details' && selectedService && selectedDate && selectedTime && (
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.bookingStep3}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                            <h3 className="text-lg font-bold text-brand-dark border-b pb-2">{t.yourInformation}</h3>
                            <div>
                                <label className="text-sm font-semibold">{t.fullName}</label>
                                <input type="text" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} className={`w-full p-2 border rounded-lg mt-1 ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`} />
                                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                            </div>
                             <div>
                                <label className="text-sm font-semibold">{t.emailAddress}</label>
                                <input type="email" value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})} className={`w-full p-2 border rounded-lg mt-1 ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                            </div>
                             <div>
                                <label className="text-sm font-semibold">{t.phoneNumber}</label>
                                <input type="tel" value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} className={`w-full p-2 border rounded-lg mt-1 ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                             <h3 className="text-lg font-bold text-brand-dark border-b pb-2 mb-4">{t.summary}</h3>
                             <div className="space-y-2 text-sm">
                                 <div className="flex justify-between"><span className="text-brand-gray">{t.service}:</span><span className="font-semibold">{selectedService.name}</span></div>
                                 {selectedVehicleSize && <div className="flex justify-between"><span className="text-brand-gray">{t.vehicleSize}:</span><span className="font-semibold">{t[`size_${selectedVehicleSize}`]}</span></div>}
                                 {selectedAddOns.size > 0 && (
                                     <div className="pt-2">
                                         <p className="font-semibold text-brand-gray">{t.addOns}:</p>
                                         <ul className="list-disc list-inside pl-2">
                                            {[...selectedAddOns].map(id => <li key={id}>{selectedService.addOns.find(a=>a.id===id)?.name}</li>)}
                                         </ul>
                                     </div>
                                 )}
                                 <div className="flex justify-between pt-2 border-t mt-2"><span className="text-brand-gray">{t.date}:</span><span className="font-semibold">{selectedDate.toLocaleDateString()}</span></div>
                                 <div className="flex justify-between"><span className="text-brand-gray">{t.time}:</span><span className="font-semibold">{selectedTime}</span></div>
                             </div>

                             <div className="mt-6 space-y-3">
                                {shopData.acceptsOnSitePayment && parseFloat(shopData.bookingFee) > 0 && (
                                    <button onClick={() => setPaymentOption('deposit')} className={`w-full text-left p-4 border rounded-lg flex justify-between items-center transition-all ${paymentOption === 'deposit' ? 'border-brand-blue ring-2 ring-brand-blue' : 'hover:border-gray-400'}`}>
                                        <span className="font-bold">{t.payDeposit}</span>
                                        <span className="font-bold text-lg">€{shopData.bookingFee}</span>
                                    </button>
                                )}
                                <button onClick={() => setPaymentOption('full')} className={`w-full text-left p-4 border rounded-lg flex justify-between items-center transition-all ${paymentOption === 'full' ? 'border-brand-blue ring-2 ring-brand-blue' : 'hover:border-gray-400'}`}>
                                    <span className="font-bold">{t.payFullAmount}</span>
                                    <span className="font-bold text-lg">€{totalPrice}</span>
                                </button>
                             </div>

                             {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                        </div>
                    </div>
                     <div className="mt-6 flex justify-center items-center gap-6">
                        <button onClick={handleBack} className="font-semibold text-brand-blue hover:underline">{t.back}</button>
                        <button onClick={handleConfirmBooking} disabled={isConfirming} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
                           <CreditCardIcon className="w-5 h-5"/>
                           <span>{isConfirming ? t.confirmingBooking : `${t.payAndConfirm} €${amountToPay}`}</span>
                        </button>
                    </div>
                </div>
            )}
            
            {step === 'confirmed' && (
                <div className="bg-white p-6 rounded-lg shadow-md text-center py-12">
                    <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.bookingConfirmed}</h2>
                    <p className="text-brand-gray max-w-md mx-auto mb-6">{t.bookingConfirmationDetails}</p>
                    <button onClick={resetBooking} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all">
                        {t.bookAnotherService}
                    </button>
                </div>
            )}

            </main>
        </div>
    );
};

export default BookingPage;