

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon, SaveIcon, TrashIcon } from '../Icons';
import { Reservation, Service } from '../Dashboard';
import { supabase } from '../../lib/supabaseClient';
import Calendar from '../booking/Calendar';
import TimeSlotPicker from '../booking/TimeSlotPicker';

interface ReservationEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reservation: Omit<Reservation, 'id'> & { id?: string }) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    reservationToEdit: Reservation | null;
    services: Service[];
    shopSchedule: any;
    shopId: string;
    minBookingNotice: string;
    maxBookingHorizon: string;
}

// Fix: Use camelCase properties to match the 'Reservation' type.
const getInitialFormData = (reservation: Reservation | null): Partial<Reservation> => {
    if (reservation) return { ...reservation };

    return {
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        serviceId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        status: 'upcoming',
        paymentStatus: 'on_site',
        serviceDetails: { name: '' , addOns: [] },
        price: 0,
        duration: 0,
    };
};

const ReservationEditor: React.FC<ReservationEditorProps> = ({
    isOpen, onClose, onSave, onDelete, reservationToEdit, services, shopSchedule, shopId, minBookingNotice, maxBookingHorizon
}) => {
    const { t } = useLanguage();
    const isEditing = !!reservationToEdit;

    const [formData, setFormData] = useState<Partial<Reservation>>(getInitialFormData(reservationToEdit));
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [existingReservations, setExistingReservations] = useState<any[]>([]);
    const [loadingReservations, setLoadingReservations] = useState(false);
    
    useEffect(() => {
        setFormData(getInitialFormData(reservationToEdit));
        // Fix: Use 'serviceId' property.
        if (reservationToEdit?.serviceId) {
            // Fix: Use 'serviceId' property.
            setSelectedService(services.find(s => s.id === reservationToEdit.serviceId) || null);
        } else {
            setSelectedService(null);
        }
    }, [reservationToEdit, services]);
    
    const totalDuration = useMemo(() => {
        if (!selectedService) return 0;
        // Simplified duration calculation for manual booking.
        // A more complex version could handle variants and add-ons.
        return parseInt(selectedService.singlePrice?.duration || '0');
    }, [selectedService]);

    useEffect(() => {
        if (!formData.date) return;
        
        const fetchReservations = async () => {
            setLoadingReservations(true);
            const { data, error } = await supabase
                .from('reservations')
                .select('start_time, duration')
                .eq('shop_id', shopId)
                .eq('date', formData.date);

            if (error) {
                console.error("Error fetching reservations for editor:", error);
                setExistingReservations([]);
            } else {
                // Exclude the current reservation if we are editing it
                // Fix: Use 'startTime' property on 'reservationToEdit'.
                const filteredData = isEditing 
                    ? data.filter(r => r.start_time !== reservationToEdit?.startTime)
                    : data;
                setExistingReservations(filteredData);
            }
            setLoadingReservations(false);
        };
        fetchReservations();

    }, [formData.date, shopId, isEditing, reservationToEdit]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceChange = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId) || null;
        setSelectedService(service);
        setFormData(prev => ({
            ...prev,
            serviceId: serviceId,
            serviceDetails: { name: service?.name || '', addOns: [] },
            price: parseInt(service?.singlePrice.price || '0'),
            duration: parseInt(service?.singlePrice.duration || '0'),
            startTime: '', // Reset time when service changes
        }));
    };
    
    const handleDateSelect = (date: Date) => {
        setFormData(prev => ({
            ...prev,
            date: date.toISOString().split('T')[0],
            startTime: '' // Reset time when date changes
        }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Reservation);
    };
    
    const handleDelete = () => {
        if (isEditing && window.confirm(t.deleteReservationConfirmation)) {
            onDelete(reservationToEdit.id);
        }
    }

    if (!isOpen) return null;

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
                    {/* Client Info */}
                    <div>
                        <h3 className="font-bold text-brand-dark mb-2">{t.clientInformation}</h3>
                        {/* Fix: Use camelCase for form field names and values. */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder={t.clientName} className="p-2 border rounded-lg" required/>
                            <input name="clientEmail" type="email" value={formData.clientEmail} onChange={handleInputChange} placeholder={t.clientEmail} className="p-2 border rounded-lg" />
                            <input name="clientPhone" type="tel" value={formData.clientPhone} onChange={handleInputChange} placeholder={t.clientPhone} className="p-2 border rounded-lg" />
                        </div>
                    </div>
                    
                    {/* Reservation Details */}
                    <div>
                        <h3 className="font-bold text-brand-dark mb-2">{t.reservationDetails}</h3>
                        <div className="mb-4">
                             <label className="block text-sm font-medium mb-1">{t.selectService}</label>
                             {/* Fix: Use 'serviceId' property. */}
                             <select value={formData.serviceId} onChange={(e) => handleServiceChange(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required>
                                <option value="" disabled>-- Select a service --</option>
                                {services.filter(s => s.status === 'active').map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                             </select>
                        </div>
                        {selectedService && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.selectDate}</label>
                                    {/* FIX: Pass missing 'minBookingNotice' and 'maxBookingHorizon' props to the Calendar component. */}
                                    <Calendar
                                        schedule={shopSchedule}
                                        serviceDuration={totalDuration}
                                        selectedDate={formData.date ? new Date(formData.date + 'T00:00:00') : null}
                                        onSelectDate={handleDateSelect}
                                        minBookingNotice={minBookingNotice}
                                        maxBookingHorizon={maxBookingHorizon}
                                    />
                                </div>
                                <div>
                                     <label className="block text-sm font-medium mb-1">{t.selectTime}</label>
                                     {loadingReservations ? <p>Loading...</p> : (
                                        <TimeSlotPicker 
                                            schedule={shopSchedule}
                                            serviceDuration={totalDuration}
                                            selectedDate={new Date(formData.date + 'T00:00:00')}
                                            // Fix: Use 'startTime' property.
                                            selectedTime={formData.startTime || null}
                                            onSelectTime={(time) => setFormData(prev => ({...prev, startTime: time}))}
                                            existingReservations={existingReservations}
                                        />
                                     )}
                                </div>
                             </div>
                        )}
                    </div>
                    
                    {/* Statuses */}
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
                                {/* Fix: Use 'paymentStatus' property. */}
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