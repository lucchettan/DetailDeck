import React, { useState, useMemo, useEffect } from 'react';
import { Service, Shop, AddOn, Formula, VehicleSizeSupplement } from '../Dashboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { SuccessIcon, ImageIcon, ChevronLeftIcon, StorefrontIcon, CarIcon, CloseIcon, CheckCircleIcon, PhoneIcon, SeatIcon, SparklesIcon, ChevronUpIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import Calendar from './Calendar';
import TimeSlotPicker from './TimeSlotPicker';
import { toCamelCase, parseSafeInt, formatDuration } from '../../lib/utils';
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

type BookingStep = 'vehicleSize' | 'categorySelection' | 'serviceSelection' | 'datetime' | 'clientInfo' | 'confirmed' | 'leadSubmitted';

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
    const [viewingCategory, setViewingCategory] = useState<'exterior' | 'interior' | 'complementary' | null>(null);

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

    // Lead state
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [leadPhoneNumber, setLeadPhoneNumber] = useState('');
    const [isSubmittingLead, setIsSubmittingLead] = useState(false);
    
    // UI State
    const [isSummaryDetailsOpen, setIsSummaryDetailsOpen] = useState(false);
    
    useEffect(() => {
        const fetchShopData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const { data: shop, error: shopError } = await supabase.from('shops').select('*').eq('id', shopId).single();
                if (shopError) throw shopError.code === 'PGRST116' ? new Error(t.shopNotFound) : shopError;

                const { data: services, error: servicesError } = await supabase.from('services').select('*').eq('shop_id', shop.id).eq('status', 'active');
                if (servicesError) throw servicesError;

                const serviceIds = services.map(s => s.id);
                const [addOnsRes, formulasRes, supplementsRes] = await Promise.all([
                    supabase.from('add_ons').select('*').eq('shop_id', shop.id),
                    serviceIds.length > 0 ? supabase.from('formulas').select('*').in('service_id', serviceIds) : Promise.resolve({ data: [], error: null }),
                    serviceIds.length > 0 ? supabase.from('service_vehicle_size_supplements').select('*').in('service_id', serviceIds) : Promise.resolve({ data: [], error: null })
                ]);

                if (addOnsRes.error || formulasRes.error || supplementsRes.error) throw new Error("Failed to load service details.");

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

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step, viewingCategory]);

    const { totalDuration, totalPrice, detailsBreakdown } = useMemo(() => {
        let duration = 0;
        let price = 0;
        if (!shopData || !selectedVehicleSize) return { totalDuration: 0, totalPrice: 0, detailsBreakdown: [] };
        
        const serviceMap = new Map(shopData.services.map(s => [s.id, s]));
        const formulaMap = new Map(shopData.formulas.map(f => [f.id, f]));
        const supplementMap = new Map(shopData.supplements.map(s => [`${s.serviceId}-${s.size}`, s]));
        
        const breakdown = selectedServices.map(sel => {
            const service = serviceMap.get(sel.serviceId);
            const formula = formulaMap.get(sel.formulaId);
            if (!service || !formula) return null;

            let itemPrice = service.basePrice + formula.additionalPrice;
            let itemDuration = service.baseDuration + formula.additionalDuration;
            
            const supplement = supplementMap.get(`${service.id}-${selectedVehicleSize}`);
            if (supplement) {
                itemPrice += supplement.additionalPrice;
                itemDuration += supplement.additionalDuration;
            }

            price += itemPrice;
            duration += itemDuration;
            
            const vehicleSizeLabel = t[`size_${selectedVehicleSize as 'S'|'M'|'L'|'XL'}`].split(' (')[0];

            return {
                name: `${service.name} - ${formula.name} - ${vehicleSizeLabel}`,
                price: itemPrice,
                duration: itemDuration
            };
        }).filter(Boolean) as { name: string, price: number, duration: number }[];

        return { totalDuration: duration, totalPrice: price, detailsBreakdown: breakdown };
    }, [selectedServices, selectedVehicleSize, shopData, t]);

    const handleServiceClick = (service: Service) => {
        const formulas = shopData?.formulas.filter(f => f.serviceId === service.id) || [];
        if (formulas.length > 1) {
            setCurrentServiceForFormula(service);
            setShowFormulaModal(true);
        } else if (formulas.length === 1) {
            setSelectedServices(prev => {
                const isSelected = prev.some(s => s.serviceId === service.id);
                if(isSelected) return prev.filter(s => s.serviceId !== service.id);
                return [...prev, { serviceId: service.id, formulaId: formulas[0].id, addOnIds: [] }];
            });
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
    
    const handlePrevStep = () => {
        if (step === 'serviceSelection') setStep('categorySelection');
        else if (step === 'categorySelection') setStep('vehicleSize');
        else if (step === 'datetime') setStep('categorySelection');
        else if (step === 'clientInfo') setStep('datetime');
    }
    
    const validateClientInfo = () => {
        const errors: ClientInfoErrors = {};
        if (!clientVehicle.trim()) errors.vehicle = t.fieldIsRequired;
        if (!clientInfo.firstName.trim()) errors.firstName = t.fieldIsRequired;
        if (!clientInfo.lastName.trim()) errors.lastName = t.fieldIsRequired;
        if (!clientInfo.email.trim()) errors.email = t.fieldIsRequired;
        else if (!/^\S+@\S+\.\S+$/.test(clientInfo.email)) errors.email = t.emailValidationError;
        if (!clientInfo.phone.trim()) errors.phone = t.fieldIsRequired;
        setClientInfoErrors(errors);
        return Object.keys(errors).length === 0;
    }

    const handleConfirmBooking = async () => {
        if (!validateClientInfo() || !selectedServices.length || !selectedDate || !selectedTime || !shopData || !selectedVehicleSize) return;
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
                    addOns: []
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
    
    const handleLeadSubmit = async () => {
        if (!leadPhoneNumber.trim() || !shopData || !selectedVehicleSize) return;
        setIsSubmittingLead(true);
        setError(null);

        const serviceMap = new Map(shopData.services.map(s => [s.id, s]));
        const formulaMap = new Map(shopData.formulas.map(f => [f.id, f]));
        
        const { error: leadError } = await supabase.from('leads').insert({
            shop_id: shopId,
            client_phone: leadPhoneNumber,
            status: 'to_call',
            selected_services: {
                vehicleSize: selectedVehicleSize,
                services: selectedServices.map(s => ({
                    serviceName: serviceMap.get(s.serviceId)?.name,
                    formulaName: formulaMap.get(s.formulaId)?.name,
                }))
            }
        });

        if (leadError) {
            console.error("Lead submission error:", leadError);
            setError("Failed to submit your request. Please try again.");
        } else {
            setStep('leadSubmitted');
            setIsLeadModalOpen(false);
        }
        setIsSubmittingLead(false);
    };

    if (loading) return <BookingPageSkeleton />;
    if (error || !shopData) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p className="text-brand-gray whitespace-pre-wrap">{error || t.errorLoadingShop}</p></div>;

    const stepTitles: Record<BookingStep, string> = {
        vehicleSize: t.selectVehicleSize,
        categorySelection: t.selectServiceCategory,
        serviceSelection: viewingCategory ? t[`select${viewingCategory.charAt(0).toUpperCase() + viewingCategory.slice(1)}Services` as keyof typeof t] : '',
        datetime: t.selectDateTime,
        clientInfo: t.yourInformation,
        confirmed: t.bookingConfirmed,
        leadSubmitted: t.callbackModalSuccessTitle
    };
    
    const serviceCategories = [
        { id: 'exterior', label: t.exteriorServices, icon: <CarIcon className="w-16 h-16 mx-auto mb-4 text-brand-dark" /> },
        { id: 'interior', label: t.interiorServices, icon: <SeatIcon className="w-16 h-16 mx-auto mb-4 text-brand-dark" /> },
        { id: 'complementary', label: t.complementaryServices, icon: <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-brand-dark" /> },
    ].filter(cat => shopData.services.some(s => s.category === cat.id));

    const renderContent = () => {
        switch(step) {
            case 'vehicleSize':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        {shopData.supportedVehicleSizes.map(size => (
                            <button key={size} onClick={() => {setSelectedVehicleSize(size); setStep('categorySelection');}}
                                className="p-4 rounded-lg border-2 text-center transition-all duration-200 flex flex-col justify-center items-center h-32 bg-white hover:border-brand-blue hover:shadow-lg">
                                <CarIcon className="w-10 h-10 text-brand-dark mb-2"/>
                                <p className="font-bold text-brand-dark">{t[`size_${size as 'S'|'M'|'L'|'XL'}`]}</p>
                            </button>
                        ))}
                    </div>
                );
            case 'categorySelection':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {serviceCategories.map(cat => (
                             <button key={cat.id} onClick={() => { setViewingCategory(cat.id as any); setStep('serviceSelection'); }}
                                className="p-6 rounded-lg border-2 text-center transition-all duration-300 bg-white hover:border-brand-blue hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center">
                                {cat.icon}
                                <p className="text-xl font-bold text-brand-dark">{cat.label}</p>
                             </button>
                        ))}
                    </div>
                )
            case 'serviceSelection':
                if (!viewingCategory) return null;
                const services = shopData.services.filter(s => s.category === viewingCategory);
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service, index) => (
                            <BookingServiceCard key={service.id} service={service} isSelected={selectedServices.some(s => s.serviceId === service.id)} onSelect={() => handleServiceClick(service)} index={index}/>
                        ))}
                    </div>
                );
            case 'datetime': return (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectDate}</h3>
                            <Calendar shopId={shopId} schedule={shopData.schedule || {}} serviceDuration={totalDuration} selectedDate={selectedDate} onSelectDate={setSelectedDate} minBookingNotice={shopData.minBookingNotice} maxBookingHorizon={shopData.maxBookingHorizon} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-brand-dark mb-4">{t.selectTime}</h3>
                            { selectedDate ? <TimeSlotPicker shopId={shopId} schedule={shopData.schedule || {}} serviceDuration={totalDuration} selectedDate={selectedDate} selectedTime={selectedTime} onSelectTime={setSelectedTime} minBookingNotice={shopData.minBookingNotice} /> : <p className="text-sm text-brand-gray">{t.selectDate}</p> }
                        </div>
                    </div>
                </div>
            );
            case 'clientInfo': return <StepClientInfo clientInfo={clientInfo} setClientInfo={setClientInfo} errors={clientInfoErrors} specialInstructions={specialInstructions} onSpecialInstructionsChange={setSpecialInstructions} clientVehicle={clientVehicle} onClientVehicleChange={setClientVehicle} />;
            case 'confirmed': return (
                 <div className="bg-white p-6 rounded-lg shadow-md text-center py-12 max-w-2xl mx-auto">
                    <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.bookingConfirmed}</h2>
                    <p className="text-brand-gray max-w-md mx-auto mb-6">{t.bookingConfirmationDetails}</p>
                    <button onClick={() => window.location.reload()} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all">{t.bookAnotherService}</button>
                </div>
            );
            case 'leadSubmitted': return (
                 <div className="bg-white p-6 rounded-lg shadow-md text-center py-12 max-w-2xl mx-auto">
                    <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">{t.callbackModalSuccessTitle}</h2>
                    <p className="text-brand-gray max-w-md mx-auto mb-6">{t.callbackModalSuccessSubtitle}</p>
                    <button onClick={() => window.location.reload()} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all">{t.bookAnotherService}</button>
                </div>
            );
            default: return null;
        }
    }

    return (
        <div className="bg-brand-light min-h-screen font-sans pb-32">
             <header className="relative h-48 bg-gray-800">
                {shopData.shopImageUrl ? <img src={shopData.shopImageUrl} alt={shopData.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><ImageIcon className="w-16 h-16 text-gray-300" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute top-0 left-0 right-0 p-6 md:p-8 container mx-auto text-white">
                    <div className="flex items-center gap-3">
                        <StorefrontIcon className="w-8 h-8 flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />
                        <h1 className="text-3xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{shopData.name}</h1>
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-8 max-w-4xl">
                {step !== 'confirmed' && step !== 'leadSubmitted' && (
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

            {(step === 'categorySelection' || step === 'serviceSelection') && (
                <div className="fixed bottom-0 left-0 right-0 z-30">
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSummaryDetailsOpen && selectedServices.length > 0 ? 'max-h-96' : 'max-h-0'}`}>
                         <div className="container mx-auto px-4">
                            <div className="bg-white p-4 rounded-t-lg shadow-lg border-x border-t">
                                <h4 className="font-bold text-brand-dark mb-2">{t.yourSelection}</h4>
                                <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
                                    {detailsBreakdown.map((item, index) => (
                                        <li key={index} className="flex justify-between items-center text-brand-gray">
                                            <span className="flex-1 pr-2">{item.name}</span>
                                            <span className="font-semibold text-brand-dark whitespace-nowrap">{formatDuration(item.duration)} - €{item.price}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex justify-between items-center gap-4">
                                <div className="text-left">
                                    <p className="text-2xl font-extrabold text-brand-dark">€{totalPrice}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-brand-gray">{formatDuration(totalDuration)}</p>
                                        {selectedServices.length > 0 && (
                                             <button onClick={() => setIsSummaryDetailsOpen(!isSummaryDetailsOpen)} className="text-sm text-brand-blue font-semibold flex items-center gap-1">
                                                <span>{t.details}</span>
                                                <ChevronUpIcon className={`w-4 h-4 transition-transform ${isSummaryDetailsOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsLeadModalOpen(true)} disabled={selectedServices.length === 0} className="w-full sm:w-auto bg-gray-200 text-brand-dark font-bold py-4 px-6 rounded-lg text-lg hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{t.requestCallback}</button>
                                    <button onClick={() => setStep('datetime')} disabled={selectedServices.length === 0} className="w-full sm:w-auto bg-brand-blue text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{t.bookNow}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {(step === 'datetime' || step === 'clientInfo') && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-30">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex justify-between items-center gap-4">
                            <div className="text-left"><p className="text-2xl font-extrabold text-brand-dark">€{totalPrice}</p><p className="text-sm text-brand-gray">{formatDuration(totalDuration)}</p></div>
                            <button onClick={step === 'clientInfo' ? handleConfirmBooking : () => setStep('clientInfo')} disabled={(step === 'datetime' && !selectedTime) || isConfirming} className="w-full sm:w-auto bg-brand-blue text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] flex justify-center">{isConfirming ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : (step === 'clientInfo' ? t.confirmBooking : t.nextStep)}</button>
                        </div>
                    </div>
                </div>
            )}

            {showFormulaModal && currentServiceForFormula && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <header className="flex justify-between items-center p-4 border-b"><h2 className="text-lg font-bold text-brand-dark">{t.chooseFormula}</h2><button onClick={() => setShowFormulaModal(false)}><CloseIcon/></button></header>
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {(shopData.formulas.filter(f => f.serviceId === currentServiceForFormula.id)).map(formula => (
                                <button key={formula.id} onClick={() => handleFormulaSelect(formula.id)} className="w-full text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-brand-blue">
                                    <div className="flex justify-between"><span className="font-bold">{formula.name}</span><span className="font-semibold text-brand-blue">+ {formula.additionalPrice}€</span></div>
                                     {formula.description && (
                                        <ul className="mt-2 text-sm text-brand-gray space-y-1 text-left">
                                            {formula.description.split('\n').map((item, index) => (item.trim() && <li key={index} className="flex items-start gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>{item.trim()}</span></li>))}
                                        </ul>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {isLeadModalOpen && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setIsLeadModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon/></button>
                        <h2 className="text-xl font-bold text-brand-dark mb-2">{t.callbackModalTitle}</h2>
                        <p className="text-brand-gray mb-4">{t.callbackModalSubtitle}</p>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><PhoneIcon className="h-5 w-5 text-gray-400" /></div>
                           <input type="tel" value={leadPhoneNumber} onChange={e => setLeadPhoneNumber(e.target.value)} placeholder={t.phoneNumberPlaceholder} className="w-full p-3 pl-10 border bg-white shadow-sm rounded-lg focus:outline-none focus:ring-1 border-gray-300 focus:border-brand-blue focus:ring-brand-blue" required />
                        </div>
                        <button onClick={handleLeadSubmit} disabled={isSubmittingLead || !leadPhoneNumber} className="w-full mt-4 bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-600 transition-all disabled:opacity-50 flex justify-center">{isSubmittingLead ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : t.submitRequest}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingFlow;