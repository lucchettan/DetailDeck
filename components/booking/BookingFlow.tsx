import React, { useState, useMemo, useEffect } from 'react';
import { Service, Shop, AddOn, Formula, VehicleSizeSupplement } from '../Dashboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { SuccessIcon, ImageIcon, ChevronLeftIcon, StorefrontIcon, CloseIcon, CheckCircleIcon, PhoneIcon, SparklesIcon, ChevronUpIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import Calendar from './Calendar';
import TimeSlotPicker from './TimeSlotPicker';
import { toCamelCase, parseSafeInt, formatDuration } from '../../lib/utils';
import StepClientInfo from './StepClientInfo';
import BookingPageSkeleton from './BookingPageSkeleton';
import BookingServiceCard from './BookingServiceCard';
import { ASSET_URLS } from '../../constants';

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

interface DetailsBreakdownItem {
    serviceName: string;
    formulaName: string;
    vehicleSizeLabel: string;
    price: number;
    duration: number;
    addOns: { name: string; price: number }[];
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

    const [currentServiceForModal, setCurrentServiceForModal] = useState<Service | null>(null);
    const [isEditingSelection, setIsEditingSelection] = useState(false);
    const [modalFormulaSelection, setModalFormulaSelection] = useState<string | null>(null);
    const [modalAddOnSelection, setModalAddOnSelection] = useState<Set<string>>(new Set());
    
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

    const { totalDuration, totalPrice, detailsBreakdown } = useMemo((): { totalDuration: number; totalPrice: number; detailsBreakdown: DetailsBreakdownItem[] } => {
        let duration = 0;
        let price = 0;
        if (!shopData || !selectedVehicleSize) return { totalDuration: 0, totalPrice: 0, detailsBreakdown: [] };
        
        const serviceMap = new Map(shopData.services.map(s => [s.id, s]));
        const formulaMap = new Map(shopData.formulas.map(f => [f.id, f]));
        const supplementMap = new Map(shopData.supplements.map(s => [`${s.serviceId}-${s.size}`, s]));
        const addOnMap = new Map(shopData.addOns.map(a => [a.id, a]));
        
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
            
            const selectedAddOns = sel.addOnIds.map(id => addOnMap.get(id)).filter(Boolean) as AddOn[];
            const addOnsPrice = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
            const addOnsDuration = selectedAddOns.reduce((sum, addon) => sum + addon.duration, 0);

            price += itemPrice + addOnsPrice;
            duration += itemDuration + addOnsDuration;
            
            const vehicleSizeLabel = t[`size_${selectedVehicleSize as 'S'|'M'|'L'|'XL'}`].split(' (')[0];

            return {
                serviceName: service.name,
                formulaName: formula.name,
                vehicleSizeLabel,
                price: itemPrice,
                duration: itemDuration,
                addOns: selectedAddOns.map(a => ({ name: a.name, price: a.price }))
            };
        }).filter(Boolean) as DetailsBreakdownItem[];

        return { totalDuration: duration, totalPrice: price, detailsBreakdown: breakdown };
    }, [selectedServices, selectedVehicleSize, shopData, t]);

    const handleServiceClick = (service: Service) => {
        const formulas = shopData?.formulas.filter(f => f.serviceId === service.id) || [];
        const existingSelection = selectedServices.find(s => s.serviceId === service.id);

        setCurrentServiceForModal(service);
        if (existingSelection) {
            setIsEditingSelection(true);
            setModalFormulaSelection(existingSelection.formulaId);
            setModalAddOnSelection(new Set(existingSelection.addOnIds));
        } else {
            setIsEditingSelection(false);
            setModalFormulaSelection(formulas[0]?.id || null);
            setModalAddOnSelection(new Set());
        }
        document.body.style.overflow = 'hidden';
    };
    
    const handleConfirmSelection = () => {
        if (!currentServiceForModal || !modalFormulaSelection) return;
        const newSelection = { serviceId: currentServiceForModal.id, formulaId: modalFormulaSelection, addOnIds: Array.from(modalAddOnSelection) };
        setSelectedServices(prev => [...prev.filter(s => s.serviceId !== currentServiceForModal.id), newSelection]);
        closeFormulaModal();
    }

    const handleRemoveFromSelection = () => {
        if (!currentServiceForModal) return;
        setSelectedServices(prev => prev.filter(s => s.serviceId !== currentServiceForModal.id));
        closeFormulaModal();
    }

    const handleToggleAddOn = (addOnId: string) => {
        setModalAddOnSelection(prev => {
            const newSet = new Set(prev);
            if (newSet.has(addOnId)) newSet.delete(addOnId);
            else newSet.add(addOnId);
            return newSet;
        });
    }
    
    const closeFormulaModal = () => {
        setCurrentServiceForModal(null);
        document.body.style.overflow = 'unset';
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
        { id: 'exterior', label: t.exteriorServices, icon: <img src={ASSET_URLS.category.exterior} alt={t.exteriorServices} className="w-24 h-16 object-contain mx-auto mb-4" /> },
        { id: 'interior', label: t.interiorServices, icon: <img src={ASSET_URLS.category.interior} alt={t.interiorServices} className="w-24 h-16 object-contain mx-auto mb-4" /> },
        { id: 'complementary', label: t.complementaryServices, icon: <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-brand-dark" /> },
    ].filter(cat => shopData.services.some(s => s.category === cat.id));

    const renderContent = () => {
        switch(step) {
            case 'vehicleSize':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {shopData.supportedVehicleSizes.map(size => {
                            const fullLabel = t[`size_${size as 'S'|'M'|'L'|'XL'}`];
                            const match = fullLabel.match(/(.*?)\s*\((.*)\)/);
                            const title = match ? match[1] : fullLabel;
                            const examples = match ? `(${match[2]})` : '';

                            return (
                                <button key={size} onClick={() => {setSelectedVehicleSize(size); setStep('categorySelection');}}
                                    className="p-4 rounded-lg border-2 text-center transition-all duration-200 flex flex-col justify-center items-center min-h-[220px] bg-white hover:border-brand-blue hover:shadow-lg">
                                    <img src={ASSET_URLS.vehicle[size as keyof typeof ASSET_URLS.vehicle]} alt={title} className="w-24 h-16 object-contain" />
                                    <p className="font-semibold text-brand-dark mt-4">{title}</p>
                                    <p className="text-sm text-brand-gray">{examples}</p>
                                </button>
                            )
                        })}
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
                                <ul className="space-y-3 text-sm max-h-48 overflow-y-auto">
                                    {detailsBreakdown.map((item, index) => (
                                        <li key={index} className="text-brand-gray border-b last:border-b-0 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-2">
                                                    <p className="font-bold text-brand-dark">{item.serviceName}</p>
                                                    <p>{item.formulaName}</p>
                                                    <p className="text-xs text-gray-500">Taille: {item.vehicleSizeLabel}</p>
                                                </div>
                                                <span className="font-semibold text-brand-dark whitespace-nowrap">€{item.price}</span>
                                            </div>
                                            {item.addOns.length > 0 && (
                                                <ul className="pl-4 mt-1 space-y-1">
                                                    {item.addOns.map((addOn, idx) => (
                                                        <li key={idx} className="flex justify-between text-xs">
                                                            <span>+ {addOn.name}</span>
                                                            <span>€{addOn.price}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div className="flex justify-between items-center w-full sm:w-auto">
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
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => setIsLeadModalOpen(true)} disabled={selectedServices.length === 0} className="flex-1 sm:w-auto bg-gray-200 text-brand-dark font-bold py-3 px-4 sm:px-6 rounded-lg text-base sm:text-lg hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{t.requestCallback}</button>
                                    <button onClick={() => setStep('datetime')} disabled={selectedServices.length === 0} className="flex-1 sm:w-auto bg-brand-blue text-white font-bold py-3 px-6 sm:px-8 rounded-lg text-base sm:text-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{t.bookNow}</button>
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

            {currentServiceForModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeFormulaModal}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <header className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-bold text-brand-dark">{currentServiceForModal.name}</h2>
                            <button onClick={closeFormulaModal}><CloseIcon/></button>
                        </header>
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {(shopData.formulas.filter(f => f.serviceId === currentServiceForModal.id)).map(formula => (
                                <label key={formula.id} className={`w-full text-left p-4 border-2 rounded-lg block cursor-pointer ${modalFormulaSelection === formula.id ? 'border-brand-blue bg-blue-50' : 'hover:bg-blue-50'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold flex items-start flex-1 pr-2">
                                            <input type="radio" name="formula" value={formula.id} checked={modalFormulaSelection === formula.id} onChange={() => setModalFormulaSelection(formula.id)} className="w-4 h-4 mr-3 text-brand-blue focus:ring-brand-blue mt-1 flex-shrink-0"/>
                                            {formula.name}
                                        </span>
                                        <span className="font-semibold text-brand-blue whitespace-nowrap">+ {formula.additionalPrice}€</span>
                                    </div>
                                     {formula.description && (
                                        <ul className="mt-2 text-sm text-brand-gray space-y-1 text-left pl-7">
                                            {formula.description.split('\n').map((item, index) => (item.trim() && <li key={index} className="flex items-start gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>{item.trim()}</span></li>))}
                                        </ul>
                                    )}
                                </label>
                            ))}
                            
                             {shopData.addOns.filter(a => a.serviceId === currentServiceForModal.id).length > 0 && (
                                <div className="pt-4 mt-4 border-t">
                                    <h3 className="text-base font-bold text-brand-dark mb-2">{t.selectAddOns}</h3>
                                    <div className="space-y-2">
                                    {shopData.addOns.filter(a => a.serviceId === currentServiceForModal.id).map(addOn => (
                                        <label key={addOn.id} className={`w-full text-left p-3 border-2 rounded-lg flex items-start justify-between cursor-pointer ${modalAddOnSelection.has(addOn.id) ? 'border-brand-blue bg-blue-50' : 'hover:bg-blue-50'}`}>
                                            <div className="flex items-start flex-1 pr-4">
                                                <input type="checkbox" checked={modalAddOnSelection.has(addOn.id)} onChange={() => handleToggleAddOn(addOn.id)} className="w-4 h-4 mr-3 rounded text-brand-blue focus:ring-brand-blue mt-1 flex-shrink-0"/>
                                                <span>{addOn.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-brand-blue whitespace-nowrap">+ {addOn.price}€</span>
                                        </label>
                                    ))}
                                    </div>
                                </div>
                            )}

                        </div>
                        <footer className="p-4 bg-gray-50 border-t flex items-center justify-between">
                            {isEditingSelection ? (
                                <button onClick={handleRemoveFromSelection} type="button" className="text-red-600 font-semibold hover:underline">{t.removeFromSelection}</button>
                            ) : (<div></div>)}
                            <button onClick={handleConfirmSelection} type="button" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600">{t.select}</button>
                        </footer>
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