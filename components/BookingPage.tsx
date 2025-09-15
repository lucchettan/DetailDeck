

import React, { useState, useMemo, useEffect } from 'react';
import { Service, Shop } from './Dashboard'; // Assuming Shop type is exported from Dashboard
import { useLanguage } from '../contexts/LanguageContext';
import Calendar from './booking/Calendar';
import TimeSlotPicker from './booking/TimeSlotPicker';
import { CheckIcon, SuccessIcon } from './Icons';
import { supabase } from '../lib/supabaseClient';

interface BookingPageProps {
  shopId: string;
}

interface ExistingReservation {
    start_time: string;
    duration: number; // in minutes
}

type FullShopData = Shop & { services: Service[] };

type BookingStep = 1 | 2 | 3 | 'confirmed';
type VehicleSize = 'S' | 'M' | 'L' | 'XL';

const BookingPage: React.FC<BookingPageProps> = ({ shopId }) => {
    const { t } = useLanguage();
    
    // Core State
    const [step, setStep] = useState<BookingStep>(1);
    const [shopData, setShopData] = useState<FullShopData | null>(null);
    const [reservations, setReservations] = useState<ExistingReservation[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [loadingReservations, setLoadingReservations] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    // Step 1 State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedVehicleSize, setSelectedVehicleSize] = useState<VehicleSize | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<Set<number>>(new Set());
    
    // Step 2 State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Step 3 State
    const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });

    // Fetch shop data on initial load
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

    // Fetch reservations when a date is selected
    useEffect(() => {
        if (!selectedDate || !shopData) return;

        const fetchReservations = async () => {
            setLoadingReservations(true);
            const dateString = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            
            const { data, error: dbError } = await supabase
                .from('reservations')
                .select('start_time, duration')
                .eq('shop_id', shopData.id)
                .eq('date', dateString);
            
            if (dbError) {
                console.error("Error fetching reservations:", dbError);
            } else {
                setReservations(data as ExistingReservation[]);
            }
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
    
    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        setSelectedVehicleSize(null);
        setSelectedAddOns(new Set());
        setSelectedDate(null);
        setSelectedTime(null);
        if (!service.varies) {
            setStep(2);
        }
    };
    
    const handleSelectVehicleSize = (size: VehicleSize) => {
        setSelectedVehicleSize(size);
        setStep(2);
    }
    
    const toggleAddOn = (addOnId: number) => {
        setSelectedAddOns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(addOnId)) {
                newSet.delete(addOnId);
            } else {
                newSet.add(addOnId);
            }
            return newSet;
        });
    };
    
    const handleConfirmBooking = async () => {
        setIsConfirming(true);
        setError(null);

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
            service_details: { // Storing a summary for easy display
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
        setStep(1);
        setSelectedService(null);
        setSelectedVehicleSize(null);
        setSelectedAddOns(new Set());
        setSelectedDate(null);
        setSelectedTime(null);
        setClientInfo({ name: '', email: '', phone: '' });
    };
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center flex-col">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div>
          <p className="mt-4 text-brand-dark font-semibold">{t.loadingShopData}</p>
        </div>
      );
    }

    if (error || !shopData) {
       return (
        <div className="min-h-screen flex items-center justify-center text-center p-4">
            <div>
                <h1 className="text-2xl font-bold text-red-600 mb-2">Oops!</h1>
                <p className="text-brand-gray">{error || t.errorLoadingShop}</p>
            </div>
        </div>
       );
    }

    const activeServices = shopData.services.filter(s => s.status === 'active');
    
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h3 className="text-xl font-bold text-brand-dark mb-4">{t.selectService}</h3>
                        <div className="space-y-4">
                            {activeServices.map(service => (
                                <div key={service.id} className="border rounded-lg p-4 transition-all hover:border-brand-blue">
                                    <h4 className="font-bold">{service.name}</h4>
                                    <p className="text-sm text-brand-gray">{service.description}</p>
                                    <button onClick={() => handleSelectService(service)} className="mt-2 text-sm font-bold text-brand-blue">{t.selectService} &rarr;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                if (!selectedService) return null;
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold text-brand-dark mb-4">{t.selectDate}</h3>
                            <Calendar schedule={shopData.schedule} serviceDuration={totalDuration} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-brand-dark mb-4">{t.selectTime}</h3>
                            {loadingReservations ? (
                                <div className="flex items-center justify-center h-full">
                                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
                                </div>
                            ) : selectedDate && <TimeSlotPicker schedule={shopData.schedule} serviceDuration={totalDuration} selectedDate={selectedDate} selectedTime={selectedTime} onSelectTime={setSelectedTime} existingReservations={reservations} /> }
                        </div>
                    </div>
                );
            case 3:
                return (
                     <div>
                        <h3 className="text-xl font-bold text-brand-dark mb-4">{t.yourInformation}</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder={t.fullName} className="w-full p-2 border rounded-lg" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} />
                            <input type="email" placeholder={t.emailAddress} className="w-full p-2 border rounded-lg" value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})} />
                            <input type="tel" placeholder={t.phoneNumber} className="w-full p-2 border rounded-lg" value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} />
                        </div>
                         {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    </div>
                );
            case 'confirmed':
                return (
                    <div className="text-center py-12">
                        <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.bookingConfirmed}</h2>
                        <p className="text-brand-gray max-w-md mx-auto mb-6">{t.bookingConfirmationDetails}</p>
                        <button onClick={resetBooking} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all">
                            {t.bookAnotherService}
                        </button>
                    </div>
                );
        }
    };
    
    if (selectedService && step === 1 && selectedService.varies && !selectedVehicleSize) {
        return (
            <div className="bg-brand-light min-h-screen">
                <div className="container mx-auto p-4 md:p-8">
                     <h2 className="text-2xl font-bold text-brand-dark text-center mb-2">{t.vehicleSize}</h2>
                     <p className="text-brand-gray text-center mb-6">{selectedService.name}</p>
                     <div className="max-w-md mx-auto space-y-3">
                        {Object.entries(selectedService.pricing).filter(([, details]) => details.enabled).map(([size, details]) => (
                            <button key={size} onClick={() => handleSelectVehicleSize(size as VehicleSize)} className="w-full text-left p-4 border rounded-lg bg-white hover:border-brand-blue flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{t[`size_${size as 'S'|'M'|'L'|'XL'}`]}</p>
                                    <p className="text-sm text-brand-gray">{details.duration} min</p>
                                </div>
                                <p className="font-bold text-lg">€{details.price}</p>
                            </button>
                        ))}
                     </div>
                </div>
            </div>
        );
    }
    
    if (activeServices.length === 0 && step !== 'confirmed') {
        return (
            <div className="bg-brand-light min-h-screen">
                <header className="bg-white shadow-sm p-4">
                    <div className="container mx-auto flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            {shopData.shopImageUrl && <img src={shopData.shopImageUrl} alt={shopData.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-brand-dark">{shopData.name}</h1>
                            <p className="text-brand-gray">{shopData.phone}</p>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto p-4 md:p-8">
                    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md text-center">
                        <h3 className="text-xl font-bold text-brand-dark mb-4">{t.selectService}</h3>
                        <p className="text-brand-gray">{t.noServicesAvailable}</p>
                    </div>
                </main>
            </div>
        );
    }


    return (
        <div className="bg-brand-light min-h-screen">
            <header className="bg-white shadow-sm p-4">
                <div className="container mx-auto flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {shopData.shopImageUrl && <img src={shopData.shopImageUrl} alt={shopData.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark">{shopData.name}</h1>
                        <p className="text-brand-gray">{shopData.phone}</p>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                {step !== 'confirmed' && (
                    <div className="flex items-center justify-center space-x-2 sm:space-x-8 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-brand-blue text-white' : 'bg-gray-200 text-brand-gray'}`}>
                            {step > s ? <CheckIcon className="w-5 h-5" /> : s}
                        </div>
                        <span className={`ml-2 hidden sm:inline font-semibold ${step >= s ? 'text-brand-dark' : 'text-brand-gray'}`}>{t[`bookingStep${s as 1|2|3}`]}</span>
                        </div>
                    ))}
                    </div>
                )}
                
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
                    {renderStep()}
                </div>
                
                {selectedService && step !== 'confirmed' && (
                <div className="bg-white p-4 rounded-lg shadow-md mt-8 sticky bottom-4 border">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <h4 className="font-bold text-brand-dark">{selectedService.name}</h4>
                             <div className="flex items-center gap-4 text-sm text-brand-gray">
                                {selectedVehicleSize && <p>{t[`size_${selectedVehicleSize}`]}</p>}
                                <p>{totalDuration} min</p>
                            </div>
                        </div>
                         {step === 1 && selectedService.addOns.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center">
                                {selectedService.addOns.map(addOn => (
                                    <button key={addOn.id} onClick={() => toggleAddOn(addOn.id)} className={`px-3 py-1.5 rounded-full text-sm border-2 ${selectedAddOns.has(addOn.id) ? 'bg-blue-100 border-brand-blue text-brand-blue' : 'bg-white border-gray-300'}`}>
                                        + {addOn.name} (€{addOn.price})
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="text-center md:text-right">
                             <p className="text-sm text-brand-gray">{t.total}</p>
                            <p className="text-2xl font-bold text-brand-dark">€{totalPrice}</p>
                        </div>
                        {step === 2 && selectedTime && (
                            <button onClick={() => setStep(3)} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600">
                                {t.nextStep}
                            </button>
                        )}
                         {step === 3 && (
                             <button onClick={handleConfirmBooking} disabled={isConfirming} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 disabled:opacity-75">
                                {isConfirming ? t.confirmingBooking : t.confirmBooking}
                            </button>
                         )}
                    </div>
                </div>
            )}
            </main>
        </div>
    );
};

export default BookingPage;