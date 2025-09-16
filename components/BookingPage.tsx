

import React, { useState, useMemo, useEffect } from 'react';
import { Service, Shop, Reservation } from './Dashboard';
import { useLanguage } from '../contexts/LanguageContext';
import { SuccessIcon, ImageIcon } from './Icons';
import { supabase } from '../lib/supabaseClient';
import BookingStepper from './booking/BookingStepper';
import Calendar from './booking/Calendar';
import TimeSlotPicker from './booking/TimeSlotPicker';
import BookingSummary from './booking/BookingSummary';
import StepServiceSelection from './booking/StepServiceSelection';
import { toCamelCase } from '../lib/utils';

interface BookingPageProps {
  shopId: string;
}

interface ExistingReservation {
    start_time: string;
    duration: number;
}

type FullShopData = Shop & { services: Service[] };

type BookingStep = 'selection' | 'datetime' | 'details' | 'confirmation' | 'confirmed';
export type VehicleSize = 'S' | 'M' | 'L' | 'XL';

const BookingPage: React.FC<BookingPageProps> = ({ shopId }) => {
    const { t } = useLanguage();
    
    // Core State
    const [step, setStep] = useState<BookingStep>('selection');
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
                if (dbError?.code === 'PGRST116') {
                    setError(t.shopNotFound);
                } else {
                    setError(t.errorLoadingShop);
                }
            } else {
                setShopData(toCamelCase(data) as FullShopData);
            }
            setLoading(false);
        };
        fetchShopData();
    }, [shopId, t.shopNotFound, t.errorLoadingShop]);

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


    // --- Event Handlers ---
    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        // Reset dependent state
        setSelectedVehicleSize(null);
        setSelectedAddOns(new Set());
        setSelectedDate(null);
        setSelectedTime(null);
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
        if (!validateDetailsStep()) {
            setStep('details');
            return;
        }
        setIsConfirming(true);
        setError(null);

        const { data: reservationData, error: insertError } = await supabase.from('reservations').insert({
            shop_id: shopId,
            service_id: selectedService?.id,
            date: selectedDate?.toISOString().split('T')[0],
            start_time: selectedTime,
            duration: totalDuration,
            price: totalPrice,
            client_name: clientInfo.name,
            client_email: clientInfo.email,
            client_phone: clientInfo.phone,
            payment_status: 'on_site',
            status: 'upcoming',
            service_details: {
                name: selectedService?.name,
                vehicleSize: selectedVehicleSize,
                addOns: selectedService?.addOns.filter(a => selectedAddOns.has(a.id))
            }
        }).select().single();

        if (insertError) {
            console.error("Booking error:", insertError);
            setError(t.bookingFailed);
            setIsConfirming(false);
        } else {
            // Temporarily disable email confirmation to fix build issues
            //  try {
            //     await supabase.functions.invoke('send-confirmation-email', {
            //         body: {
            //             reservation: reservationData,
            //             shop: shopData,
            //             locale: 'fr'
            //         },
            //     });
            //  } catch (emailError) {
            //      console.error("Failed to send confirmation email:", emailError);
            //  }
            setStep('confirmed');
            setIsConfirming(false);
        }
    };

    const resetBooking = () => {
        setStep('selection');
        setSelectedService(null);
        setSelectedVehicleSize(null);
        setSelectedAddOns(new Set());
        setSelectedDate(null);
        setSelectedTime(null);
        setClientInfo({ name: '', email: '', phone: '' });
        setFormErrors({});
        setError(null);
    };
    
    // --- Render Logic ---
    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div></div>;
    if (error || !shopData) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p className="text-brand-gray">{error || t.errorLoadingShop}</p></div>;

    const activeServices = shopData.services?.filter(s => s.status === 'active') || [];
    
    const stepperSteps = [
        { id: 'selection', name: t.stepperSelectionAndOptions },
        { id: 'datetime', name: t.stepperDateTime },
        { id: 'confirmation', name: t.stepperConfirmation }
    ];

    const renderStepContent = () => {
        switch(step) {
            case 'selection':
                return (
                    <StepServiceSelection
                        services={activeServices}
                        selectedService={selectedService}
                        selectedVehicleSize={selectedVehicleSize}
                        selectedAddOns={selectedAddOns}
                        onSelectService={handleSelectService}
                        onSelectVehicleSize={setSelectedVehicleSize}
                        onToggleAddOn={toggleAddOn}
                        onComplete={() => setStep('datetime')}
                    />
                );
            case 'datetime':
                 return (
                    <div>
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.selectDate} & {t.time}</h2>
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
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep('selection')} className="font-semibold text-brand-gray hover:text-brand-dark">{t.back}</button>
                            <button onClick={() => setStep('confirmation')} disabled={!selectedTime} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">{t.nextStep}</button>
                        </div>
                    </div>
                );
             case 'confirmation':
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">{t.confirmYourBooking}</h2>
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
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep('datetime')} className="font-semibold text-brand-gray hover:text-brand-dark">{t.back}</button>
                            <button onClick={handleConfirmBooking} disabled={isConfirming || !validateDetailsStep()} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
                               <span>{isConfirming ? t.confirmingBooking : t.confirmBooking}</span>
                            </button>
                        </div>
                    </div>
                )
            default:
                return null;
        }
    }


    return (
        <div className="bg-brand-light min-h-screen font-sans">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
                <div className="container mx-auto flex items-center gap-4">
                     <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                        {shopData.shopImageUrl ? 
                            <img src={shopData.shopImageUrl} alt={shopData.name} className="w-full h-full object-cover" />
                             : <ImageIcon className="w-8 h-8 text-gray-400" />
                        }
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark">{shopData.name}</h1>
                        <p className="text-brand-gray">{shopData.address}</p>
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-8">
            
             {step === 'confirmed' ? (
                 <div className="bg-white p-6 rounded-lg shadow-md text-center py-12">
                    <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.bookingConfirmed}</h2>
                    <p className="text-brand-gray max-w-md mx-auto mb-6">{t.bookingConfirmationDetails}</p>
                    <button onClick={resetBooking} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all">
                        {t.bookAnotherService}
                    </button>
                </div>
             ) : (
                <>
                    <div className="mb-8">
                        <BookingStepper steps={stepperSteps} currentStepId={step} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        <div className="md:col-span-2">
                            {renderStepContent()}
                        </div>
                        <div className="md:col-span-1 md:sticky md:top-28">
                             {selectedService && (
                                <BookingSummary 
                                    service={selectedService}
                                    vehicleSize={selectedVehicleSize}
                                    addOns={[...selectedAddOns].map(id => selectedService.addOns.find(a => a.id === id)).filter(Boolean) as any[]}
                                    date={selectedDate}
                                    time={selectedTime}
                                    totalPrice={totalPrice}
                                    totalDuration={totalDuration}
                                />
                             )}
                        </div>
                    </div>
                </>
             )}
            </main>
        </div>
    );
};

export default BookingPage;