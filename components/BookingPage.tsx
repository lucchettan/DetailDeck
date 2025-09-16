

import React, { useState, useMemo, useEffect } from 'react';
import { Service, Shop, Reservation } from './Dashboard';
import { useLanguage } from '../contexts/LanguageContext';
import { SuccessIcon, ImageIcon, ChevronLeftIcon } from './Icons';
import { supabase } from '../lib/supabaseClient';
import Calendar from './booking/Calendar';
import TimeSlotPicker from './booking/TimeSlotPicker';
import FloatingSummary from './booking/FloatingSummary';
import { toCamelCase, parseSafeInt } from '../lib/utils';
import BookingForm from './booking/BookingForm';

interface BookingPageProps {
  shopId: string;
}

interface ExistingReservation {
    start_time: string;
    duration: number;
}

type FullShopData = Shop & { services: Service[] };

type BookingStep = 'selection' | 'datetime' | 'confirmed';
export type VehicleSize = 'S' | 'M' | 'L' | 'XL';

const BookingPage: React.FC<BookingPageProps> = ({ shopId }) => {
    const { t } = useLanguage();
    
    const [step, setStep] = useState<BookingStep>('selection');
    const [shopData, setShopData] = useState<FullShopData | null>(null);
    const [reservations, setReservations] = useState<ExistingReservation[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [loadingReservations, setLoadingReservations] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedVehicleSize, setSelectedVehicleSize] = useState<VehicleSize | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<Set<number>>(new Set());
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    
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
                setError(dbError?.code === 'PGRST116' ? t.shopNotFound : t.errorLoadingShop);
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

        selectedAddOns.forEach(addOnId => {
            const addOn = selectedService.addOns.find(a => a.id === addOnId);
            if (addOn) {
                duration += parseSafeInt(addOn.duration);
                price += parseSafeInt(addOn.price);
            }
        });
        
        return { totalDuration: duration, totalPrice: price };
    }, [selectedService, selectedVehicleSize, selectedAddOns]);

    const toggleAddOn = (addOnId: number) => {
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

    const handleConfirmBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return;

        setIsConfirming(true);
        setError(null);

        // In a real app, you would collect client info here.
        // For now, we use placeholders.
        const clientName = "John Doe"; 
        const clientEmail = "john.doe@example.com";
        const clientPhone = "555-1234";

        const { error: insertError } = await supabase.from('reservations').insert({
            shop_id: shopId,
            service_id: selectedService.id,
            date: selectedDate.toISOString().split('T')[0],
            start_time: selectedTime,
            duration: totalDuration,
            price: totalPrice,
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            payment_status: 'on_site',
            status: 'upcoming',
            service_details: {
                name: selectedService.name,
                vehicleSize: selectedVehicleSize,
                addOns: selectedService.addOns.filter(a => selectedAddOns.has(a.id)),
                special_instructions: specialInstructions,
            }
        });
        
        if (insertError) {
            console.error("Booking error:", insertError);
            setError(t.bookingFailed);
        } else {
            setStep('confirmed');
        }
        setIsConfirming(false);
    };

    const resetBooking = () => {
        setStep('selection');
        setSelectedService(null);
        setSelectedVehicleSize(null);
        setSelectedAddOns(new Set());
        setSpecialInstructions('');
        setSelectedDate(null);
        setSelectedTime(null);
        setError(null);
    };
    
    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div></div>;
    if (error || !shopData) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p className="text-brand-gray">{error || t.errorLoadingShop}</p></div>;

    const activeServices = shopData.services?.filter(s => s.status === 'active') || [];

    const renderContent = () => {
        if (step === 'confirmed') {
            return (
                <div className="bg-white p-6 rounded-lg shadow-md text-center py-12 max-w-2xl mx-auto">
                    <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.bookingConfirmed}</h2>
                    <p className="text-brand-gray max-w-md mx-auto mb-6">{t.bookingConfirmationDetails}</p>
                    <button onClick={resetBooking} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all">
                        {t.bookAnotherService}
                    </button>
                </div>
            )
        }
        
        if (step === 'datetime') {
             return (
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => setStep('selection')} className="flex items-center gap-2 font-semibold text-brand-gray hover:text-brand-dark mb-4">
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span>{t.back}</span>
                    </button>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectDate}</h3>
                                <Calendar 
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
                                {loadingReservations ? <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div></div>
                                : selectedDate ? <TimeSlotPicker schedule={shopData.schedule} serviceDuration={totalDuration} selectedDate={selectedDate} selectedTime={selectedTime} onSelectTime={setSelectedTime} existingReservations={reservations} />
                                : <p className="text-sm text-brand-gray">{t.selectDate}</p>
                                }
                            </div>
                        </div>
                    </div>
                     <FloatingSummary
                        totalDuration={totalDuration}
                        totalPrice={totalPrice}
                        onButtonClick={handleConfirmBooking}
                        buttonText={isConfirming ? t.confirmingBooking : t.confirmBooking}
                        buttonDisabled={!selectedTime || isConfirming}
                    />
                </div>
            )
        }

        return (
            <div className="max-w-4xl mx-auto pb-24">
                <BookingForm
                    services={activeServices}
                    selectedService={selectedService}
                    onSelectService={handleSelectService}
                    selectedVehicleSize={selectedVehicleSize}
                    onSelectVehicleSize={setSelectedVehicleSize}
                    selectedAddOns={selectedAddOns}
                    onToggleAddOn={toggleAddOn}
                    specialInstructions={specialInstructions}
                    onSpecialInstructionsChange={setSpecialInstructions}
                    totalDuration={totalDuration}
                />
                {selectedService && (
                    <FloatingSummary
                        totalDuration={totalDuration}
                        totalPrice={totalPrice}
                        onButtonClick={() => setStep('datetime')}
                        buttonText={t.continueToDateTime}
                        buttonDisabled={(selectedService.varies && !selectedVehicleSize) || isConfirming}
                    />
                )}
            </div>
        )
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 container mx-auto">
                    <h1 className="text-3xl font-bold text-white shadow-lg">{shopData.name}</h1>
                    <p className="text-white text-lg shadow-md mt-1">{shopData.address}</p>
                </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default BookingPage;