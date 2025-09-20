
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon, SaveIcon, TrashIcon, PencilIcon } from '../Icons';
import { Reservation, Service } from '../Dashboard';
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
        date: toYYYYMMDD(new Date()),
        startTime: '',
        status: 'upcoming',
        paymentStatus: 'on_site',
        serviceDetails: { vehicleSize: 'M', services: [] },
        price: 0,
        duration: 0,
    };
};

const initialSchedule = {
  monday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  tuesday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  wednesday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  thursday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  friday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
  saturday: { isOpen: false, timeframes: [] },
  sunday: { isOpen: false, timeframes: [] },
};


const ReservationEditor: React.FC<ReservationEditorProps> = ({
    isOpen, onClose, onSave, onDelete, reservationToEdit, services, shopSchedule, shopId, minBookingNotice, maxBookingHorizon
}) => {
    const { t } = useLanguage();
    const isEditing = !!reservationToEdit;

    const [formData, setFormData] = useState<Partial<Reservation>>(getInitialFormData(reservationToEdit));
    const [isEditingDateTime, setIsEditingDateTime] = useState(!isEditing);

    useEffect(() => {
        setFormData(getInitialFormData(reservationToEdit));
        setIsEditingDateTime(!reservationToEdit);
    }, [reservationToEdit]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        onSave(formData as Reservation);
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
    
    const servicesSummary = useMemo(() => {
        if (!formData.serviceDetails?.services || formData.serviceDetails.services.length === 0) {
            return "Aucun service sélectionné.";
        }
        return formData.serviceDetails.services.map(s => `${s.serviceName} (${s.formulaName})`).join(', ');
    }, [formData.serviceDetails]);


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
                            <input name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder={t.clientName} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" required/>
                            <input name="clientEmail" type="email" value={formData.clientEmail || ''} onChange={handleInputChange} placeholder={t.clientEmail} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" />
                            <input name="clientPhone" type="tel" value={formData.clientPhone || ''} onChange={handleInputChange} placeholder={t.clientPhone} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue" />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-brand-dark mb-2">{t.reservationDetails}</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-semibold text-brand-dark">Services</p>
                            <p className="text-sm text-brand-gray">{servicesSummary}</p>
                        </div>
                        <div className="mt-4">
                            {isEditingDateTime ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t.selectDate}</label>
                                            <Calendar
                                                shopId={shopId}
                                                schedule={shopSchedule || initialSchedule}
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
                                                    schedule={shopSchedule || initialSchedule}
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
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-brand-dark mb-2">Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.reservationStatus}</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue">
                                    <option value="upcoming">{t.status_upcoming}</option>
                                    <option value="completed">{t.status_completed}</option>
                                    <option value="cancelled">{t.status_cancelled}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.paymentStatus}</label>
                                <select name="paymentStatus" value={formData.paymentStatus} onChange={handleInputChange} className="w-full p-2 border bg-white border-gray-300 shadow-sm rounded-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue">
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
                            <button type="button" onClick={handleDelete} className="text-red-600 font-semibold hover:underline flex items-center gap-2">
                                <TrashIcon className="w-5 h-5"/> {t.deleteReservation}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-gray-300">{t.cancel}</button>
                        <button type="submit" onClick={handleSubmit} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center gap-2">
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
