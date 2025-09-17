import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon, SaveIcon, TrashIcon, PencilIcon } from '../Icons';
import { Reservation, Service, AddOn } from '../Dashboard';
import { supabase } from '../../lib/supabaseClient';
import Calendar from '../booking/Calendar';
import TimeSlotPicker from '../booking/TimeSlotPicker';
import { toYYYYMMDD } from '../../lib/utils';

interface ReservationEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reservation: Omit<Reservation, 'id'> & { id?: string }) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    reservationToEdit: Reservation | null;
    services: Service[];
    addOns: AddOn[];
    shopSchedule: any;
    shopId: string;
    minBookingNotice: string;
    maxBookingHorizon: string;
}

const getInitialFormData = (reservation: Reservation | null): Partial<Reservation> => {
    if (reservation) return { ...reservation };

    return {
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        serviceId: '',
        date: toYYYYMMDD(new Date()),
        startTime: '',
        status: 'upcoming',
        paymentStatus: 'on_site',
        serviceDetails: { name: '' , addOns: [] },
        price: 0,
        duration: 0,
    };
};

const ReservationEditor: React.FC<ReservationEditorProps> = ({
    isOpen, onClose, onSave, onDelete, reservationToEdit, services, addOns, shopSchedule, shopId, minBookingNotice, maxBookingHorizon
}) => {
    const { t } = useLanguage();
    const isEditing = !!reservationToEdit;

    const [formData, setFormData] = useState<Partial<Reservation>>(getInitialFormData(reservationToEdit));
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
    const [isEditingDateTime, setIsEditingDateTime] = useState(!isEditing);

    useEffect(() => {
        setFormData(getInitialFormData(reservationToEdit));
        setIsEditingDateTime(!reservationToEdit);
        if (reservationToEdit?.serviceId) {
            const service = services.find(s => s.id === reservationToEdit.serviceId) || null;
            setSelectedService(service);
            const initialAddOnIds = reservationToEdit.serviceDetails?.addOns?.map((a: any) => a.id).filter(Boolean) || [];
            setSelectedAddOnIds(new Set(initialAddOnIds));
        } else {
            setSelectedService(null);
            setSelectedAddOnIds(new Set());
        }
    }, [reservationToEdit, services]);
    
    const availableAddOns = useMemo(() => {
        if (!selectedService || !addOns) return [];
        const global = addOns.filter(a => !a.serviceId);
        const specific = addOns.filter(a => a.serviceId === selectedService.id);
        return [...specific, ...global];
    }, [selectedService, addOns]);
    
    useEffect(() => {
        if (!selectedService) return;

        // Note: Admin editor currently only supports single-price services.
        let basePrice = parseInt(selectedService.singlePrice?.price || '0', 10);
        let baseDuration = parseInt(selectedService.singlePrice?.duration || '0', 10);
        
        const addOnMap = new Map(availableAddOns.map(a => [a.id, a]));
        selectedAddOnIds.forEach(id => {
            const addOn = addOnMap.get(id);
            if (addOn) {
                basePrice += parseInt(addOn.price || '0', 10);
                baseDuration += parseInt(addOn.duration || '0', 10);
            }
        });
        
        setFormData(prev => ({ ...prev, price: basePrice, duration: baseDuration }));

    }, [selectedService, selectedAddOnIds, availableAddOns]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceChange = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId) || null;
        setSelectedService(service);
        setSelectedAddOnIds(new Set()); // Reset add-ons when service changes
        setFormData(prev => ({
            ...prev,
            serviceId: serviceId,
            serviceDetails: { name: service?.name || '', addOns: [] },
            startTime: '',
        }));
    };
    
    const handleToggleAddOn = (addOnId: string) => {
        setSelectedAddOnIds(prev => {
            const newSet = new Set(prev);
            newSet.has(addOnId) ? newSet.delete(addOnId) : newSet.add(addOnId);
            return newSet;
        });
    };

    const handleDateSelect = (date: Date) => {
        setFormData(prev => ({
            ...prev,
            date: toYYYYMMDD(date),
            startTime: ''
        }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const addOnMap = new Map(availableAddOns.map(a => [a.id, a]));
        const confirmedAddOns = Array.from(selectedAddOnIds).map(id => {
            const addOn = addOnMap.get(id);
            return { id: addOn?.id, name: addOn?.name, price: addOn?.price, duration: addOn?.duration };
        }).filter(a => a.name);

        const dataToSave = { ...formData };
        dataToSave.serviceDetails = {
            ...(dataToSave.serviceDetails || { name: selectedService?.name || '' }),
            addOns: confirmedAddOns,
        };
        onSave(dataToSave as Reservation);
    };
    
    const handleDelete = () => {
        if (isEditing && window.confirm(t.deleteReservationConfirmation)) {
            onDelete(reservationToEdit.id);
        }
    }

    if (!isOpen) return null;
    
    const formattedDateForDisplay = formData.date 
        ? new Date(formData.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'No date selected';

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-brand-dark">
                        {isEditing ? t.editReservation : t.addReservation}
                    </h2>
                    <button onClick={onClose}><CloseIcon /></button>
                </header>
                
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                    <div>
                        <h3 className="font-bold text-brand-dark mb-2">{t.clientInformation}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder={t.clientName} className="p-2 border rounded-lg" required/>
                            <input name="clientEmail" type="email" value={formData.clientEmail} onChange={handleInputChange} placeholder={t.clientEmail} className="p-2 border rounded-lg" />
                            <input name="clientPhone" type="tel" value={formData.clientPhone} onChange={handleInputChange} placeholder={t.clientPhone} className="p-2 border rounded-lg" />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-brand-dark mb-2">{t.reservationDetails}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.selectService}</label>
                                <select value={formData.serviceId} onChange={(e) => handleServiceChange(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required>
                                    <option value="" disabled>-- Select a service --</option>
                                    {services.filter(s => s.status === 'active').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                {selectedService && availableAddOns.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t.addOns}</label>
                                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border max-h-32 overflow-y-auto">
                                            {availableAddOns.map(addOn => (
                                                <label key={addOn.id} className="flex items-center justify-between cursor-pointer p-1">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAddOnIds.has(addOn.id)}
                                                            onChange={() => handleToggleAddOn(addOn.id)}
                                                            className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                                                        />
                                                        <span className="ml-3 text-sm text-brand-dark">{addOn.name}</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-brand-gray">+€{addOn.price}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedService && (
                            <div className="mt-4">
                                {isEditingDateTime ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t.selectDate}</label>
                                                <Calendar
                                                    shopId={shopId}
                                                    schedule={shopSchedule}
                                                    serviceDuration={formData.duration || 0}
                                                    selectedDate={formData.date ? new Date(formData.date + 'T00:00:00') : null}
                                                    onSelectDate={handleDateSelect}
                                                    minBookingNotice={minBookingNotice}
                                                    maxBookingHorizon={maxBookingHorizon}
                                                    disableBounds={true}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t.selectTime}</label>
                                                {formData.date && (
                                                    <TimeSlotPicker 
                                                        shopId={shopId}
                                                        schedule={shopSchedule}
                                                        serviceDuration={formData.duration || 0}
                                                        selectedDate={new Date(formData.date + 'T00:00:00')}
                                                        selectedTime={formData.startTime || null}
                                                        onSelectTime={(time) => setFormData(prev => ({...prev, startTime: time}))}
                                                        editingReservationId={reservationToEdit?.id}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingDateTime(false)}
                                                disabled={!formData.startTime}
                                                className="bg-gray-200 text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t.confirm}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-brand-dark">{formattedDateForDisplay}</p>
                                                <p className="text-2xl font-bold text-brand-blue mt-1">{formData.startTime}</p>
                                            </div>
                                            <button type="button" onClick={() => setIsEditingDateTime(true)} className="flex items-center gap-2 bg-gray-200 text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">
                                                <PencilIcon />
                                                <span>{t.edit}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-brand-dark mb-2">Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.reservationStatus}</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-white">
                                    <option value="upcoming">{t.status_upcoming}</option>
                                    <option value="completed">{t.status_completed}</option>
                                    <option value="cancelled">{t.status_cancelled}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.paymentStatus}</label>
                                <select name="paymentStatus" value={formData.paymentStatus} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-white">
                                    <option value="paid">{t.payment_paid}</option>
                                    <option value="pending_deposit">{t.payment_pending_deposit}</option>
                                    <option value="on_site">{t.payment_on_site}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>

                <footer className="flex justify-between items-center p-4 border-t mt-auto">
                    <div>
                        {isEditing && (
                            <button onClick={handleDelete} className="text-red-600 font-semibold hover:underline flex items-center gap-2">
                                <TrashIcon className="w-5 h-5"/> {t.deleteReservation}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="bg-gray-200 text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-gray-300">{t.cancel}</button>
                        <button onClick={handleSubmit} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                            <SaveIcon className="w-5 h-5" />
                            {isEditing ? t.saveChanges : t.createReservation}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ReservationEditor;