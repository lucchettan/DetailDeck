
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon, SaveIcon, TrashIcon, PencilIcon } from '../Icons';
import { Reservation, Service, Shop, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';
import Calendar from '../booking/Calendar';
import TimeSlotPicker from '../booking/TimeSlotPicker';
import { toYYYYMMDD, toCamelCase } from '../../lib/utils';
import { supabase } from '../../lib/supabaseClient';
import ServiceSelector from './ServiceSelector';

interface ReservationEditorProps {
    isOpen: boolean;
    onClose: () => void;
    // FIX: Changed props to be self-contained. The component now fetches its own data using the ID.
    reservationId: string | null;
    shopData: Shop;
    vehicleSizes: ShopVehicleSize[];
    serviceCategories: ShopServiceCategory[];
    onSave: (reservation: Omit<Reservation, 'id'> & { id?: string }) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
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


const ReservationEditor: React.FC<ReservationEditorProps> = ({
    isOpen, onClose, onSave, onDelete, reservationId, shopData, vehicleSizes, serviceCategories
}) => {
    const { t } = useLanguage();
    const isEditing = !!reservationId;

    const [formData, setFormData] = useState<Partial<Reservation>>(getInitialFormData(null));
    const [isEditingDateTime, setIsEditingDateTime] = useState(!isEditing);
    const [selectedServices, setSelectedServices] = useState<any[]>([]);

    useEffect(() => {
        const fetchReservation = async () => {
            if (reservationId) {
                const { data, error } = await supabase.from('reservations').select('*').eq('id', reservationId).single();
                if (error) {
                    console.error("Failed to fetch reservation for editing", error);
                    onClose(); // Close if we can't fetch data
                } else {
                    setFormData(toCamelCase(data) as Reservation);
                    setIsEditingDateTime(false);
                }
            } else {
                setFormData(getInitialFormData(null));
                setIsEditingDateTime(true);
            }
        }
        if (isOpen) {
            fetchReservation();
        }
    }, [reservationId, isOpen, onClose]);

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
            onDelete(reservationId);
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
            <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-neutral-dark">
                        {isEditing ? t.editReservation : t.addReservation}
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost p-2">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                    <div>
                        <h3 className="font-bold text-neutral-dark mb-4">{t.clientInformation}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="form-label">Nom du client *</label>
                                <input
                                    name="clientName"
                                    value={formData.clientName}
                                    onChange={handleInputChange}
                                    placeholder={t.clientName}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input
                                    name="clientEmail"
                                    type="email"
                                    value={formData.clientEmail || ''}
                                    onChange={handleInputChange}
                                    placeholder={t.clientEmail}
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">Téléphone</label>
                                <input
                                    name="clientPhone"
                                    type="tel"
                                    value={formData.clientPhone || ''}
                                    onChange={handleInputChange}
                                    placeholder={t.clientPhone}
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-neutral-dark mb-4">{t.reservationDetails}</h3>
                        <ServiceSelector
                            shopId={shopData.id}
                            selectedServices={selectedServices}
                            onServicesChange={setSelectedServices}
                            vehicleSizes={vehicleSizes}
                            serviceCategories={serviceCategories}
                        />
                    </div>

                    <div>
                        <div className="mt-4">
                            {isEditingDateTime ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="form-label">{t.selectDate}</label>
                                            <Calendar
                                                shopId={shopData.id}
                                                schedule={shopData.schedule}
                                                serviceDuration={formData.duration || 0}
                                                selectedDate={formData.date ? new Date(formData.date + 'T00:00:00') : null}
                                                onSelectDate={handleDateSelect}
                                                minBookingNotice={shopData.minBookingNotice}
                                                maxBookingHorizon={shopData.maxBookingHorizon}
                                                disableBounds={true}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">{t.selectTime}</label>
                                            {formData.date && (
                                                <TimeSlotPicker
                                                    shopId={shopData.id}
                                                    schedule={shopData.schedule}
                                                    serviceDuration={formData.duration || 0}
                                                    selectedDate={new Date(formData.date + 'T00:00:00')}
                                                    selectedTime={formData.startTime || null}
                                                    onSelectTime={(time) => setFormData(prev => ({ ...prev, startTime: time }))}
                                                    editingReservationId={reservationId || undefined}
                                                    minBookingNotice={shopData.minBookingNotice}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingDateTime(false)}
                                            disabled={!formData.startTime}
                                            className="btn btn-primary"
                                        >
                                            {t.confirm}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-neutral-dark">{formattedDateForDisplay}</p>
                                            <p className="text-2xl font-bold text-primary mt-1">{formData.startTime}</p>
                                        </div>
                                        <button type="button" onClick={() => setIsEditingDateTime(true)} className="btn btn-secondary flex items-center gap-2">
                                            <PencilIcon className="w-4 h-4" />
                                            <span>{t.edit}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-neutral-dark mb-4">Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">{t.reservationStatus}</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="form-input">
                                    <option value="upcoming">{t.status_upcoming}</option>
                                    <option value="completed">{t.status_completed}</option>
                                    <option value="cancelled">{t.status_cancelled}</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">{t.paymentStatus}</label>
                                <select name="paymentStatus" value={formData.paymentStatus} onChange={handleInputChange} className="form-input">
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
                                <TrashIcon className="w-5 h-5" /> {t.deleteReservation}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="btn btn-secondary">{t.cancel}</button>
                        <button type="submit" onClick={handleSubmit} className="btn btn-primary flex items-center gap-2">
                            <SaveIcon className="w-4 h-4" />
                            {isEditing ? t.saveChanges : t.createReservation}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ReservationEditor;
