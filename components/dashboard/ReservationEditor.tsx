
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CloseIcon, SaveIcon, TrashIcon, PencilIcon } from '../Icons';
import { Reservation, Service, Shop, ShopVehicleSize, ShopServiceCategory } from '../Dashboard';
import Calendar from '../booking/Calendar';
import TimeSlotPicker from '../booking/TimeSlotPicker';
import { toYYYYMMDD, toCamelCase } from '../../lib/utils';
import { supabase } from '../../lib/supabaseClient';
import ServiceSelector from './ServiceSelector';

// Fonction pour formater la durée en XXhXXmn
const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h${remainingMinutes}min`;
};

// Schedule par défaut pour éviter les erreurs
const defaultSchedule = {
    monday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
    tuesday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
    wednesday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
    thursday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
    friday: { isOpen: true, timeframes: [{ from: '09:00', to: '17:00' }] },
    saturday: { isOpen: false, timeframes: [] },
    sunday: { isOpen: false, timeframes: [] },
};

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
    validationError?: string | null;
}

const getInitialFormData = (reservation: Reservation | null, vehicleSizes: ShopVehicleSize[]): Partial<Reservation> => {
    const firstVehicleSize = vehicleSizes && vehicleSizes.length > 0 ? vehicleSizes[0] : null;

    // Valeurs par défaut pour tous les champs
    const defaultData = {
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        vehicleInfo: '',
        date: toYYYYMMDD(new Date()),
        startTime: '',
        status: 'upcoming',
        vehicle_size_id: firstVehicleSize?.id || '',
        price: 0,
        total_duration: 0,
    };

    // Si on a une réservation existante, on merge avec les valeurs par défaut
    if (reservation) {
        return {
            ...defaultData,
            ...reservation,
            // S'assurer que les champs texte ne sont jamais null
            customerName: reservation.customerName || '',
            customerEmail: reservation.customerEmail || '',
            customerPhone: reservation.customerPhone || '',
            vehicleInfo: reservation.vehicleInfo || '',
            startTime: reservation.startTime || '',
            date: reservation.date || toYYYYMMDD(new Date())
        };
    }

    return defaultData;
};


const ReservationEditor: React.FC<ReservationEditorProps> = ({
    isOpen, onClose, onSave, onDelete, reservationId, shopData, vehicleSizes, serviceCategories, validationError
}) => {
    const { t } = useLanguage();
    const isEditing = !!reservationId;

    const [formData, setFormData] = useState<Partial<Reservation>>({});
    const [isEditingDateTime, setIsEditingDateTime] = useState(!isEditing);
    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [isEditMode, setIsEditMode] = useState(false); // Mode lecture par défaut pour les réservations existantes

    useEffect(() => {
        const fetchReservation = async () => {
            if (reservationId) {
                const { data, error } = await supabase
                    .from('reservations')
                    .select('*')
                    .eq('id', reservationId)
                    .single();
                if (error) {
                    console.error("Failed to fetch reservation for editing", error);
                    onClose(); // Close if we can't fetch data
                } else {
                    const reservation = toCamelCase(data) as Reservation;
                    console.log('🔍 Reservation loaded for editing:', reservation);
                    console.log('🔍 Raw data from DB:', data);
                    setFormData(reservation);
                    setIsEditingDateTime(false);
                    setIsEditMode(false); // Mode lecture par défaut

                    // Utiliser directement la colonne services JSONB
                    if (reservation.services && Array.isArray(reservation.services) && reservation.services.length > 0) {
                        console.log('✅ Services found in JSONB column:', reservation.services);
                        setSelectedServices(reservation.services);
                    } else {
                        console.log('❌ No services found in JSONB column');
                        setSelectedServices([]);
                    }
                }
            } else {
                setFormData(getInitialFormData(null, vehicleSizes));
                setIsEditingDateTime(true);
                setSelectedServices([]);
            }
        }
        if (isOpen) {
            fetchReservation();
        }
    }, [reservationId, isOpen, onClose, vehicleSizes]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateSelect = (date: Date) => {
        setFormData(prev => ({
            ...prev,
            date: toYYYYMMDD(date),
            start_time: ''
        }));
    }

    // Calculate total duration from selected services
    const calculateTotalDuration = () => {
        return selectedServices.reduce((total, service) => {
            return total + (service.duration || 0);
        }, 0);
    }

    // Calculate total price from selected services
    const calculateTotalPrice = () => {
        return selectedServices.reduce((total, service) => {
            return total + (service.totalPrice || 0);
        }, 0);
    }

    // Update formData when services change
    useEffect(() => {
        const firstService = selectedServices[0];
        setFormData(prev => ({
            ...prev,
            total_duration: calculateTotalDuration(),
            price: calculateTotalPrice(),
            vehicle_size_id: firstService?.vehicleSizeId || vehicleSizes[0]?.id || ''
        }));
    }, [selectedServices, vehicleSizes]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('🔍 FormData before submit:', formData);

        // Extraire les données des services sélectionnés
        const firstService = selectedServices[0];
        const reservationData = {
            ...formData,
            // Données du premier service (pour l'instant on gère un seul service par réservation)
            service_id: firstService?.serviceId,
            formula_id: firstService?.formulaId || 'default',
            vehicle_size_id: firstService?.vehicleSizeId,
            selected_addons: firstService?.addOns || [],
            // Garder aussi le JSONB pour compatibilité
            services: selectedServices
        } as Reservation;
        onSave(reservationData);
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
        if (!selectedServices || selectedServices.length === 0) {
            return "Aucun service sélectionné.";
        }
        return selectedServices.map(s => `${s.serviceName} (${s.formulaName || 'Standard'})`).join(', ');
    }, [selectedServices]);

    // Composant de récapitulatif pour le mode lecture
    const ReservationSummary = () => {
        if (!isEditing || isEditMode) return null;

        return (
            <div className="space-y-6">
                {/* En-tête avec bouton Modifier */}
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-neutral-dark">Détails de la réservation</h3>
                    <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <PencilIcon className="w-4 h-4" />
                        Modifier
                    </button>
                </div>

                {/* Informations client */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-neutral-dark mb-3">Client</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <span className="text-sm text-gray-600">Nom :</span>
                            <p className="font-medium">{formData.customerName}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Email :</span>
                            <p className="font-medium">{formData.customerEmail || 'Non renseigné'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Téléphone :</span>
                            <p className="font-medium">{formData.customerPhone || 'Non renseigné'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Véhicule :</span>
                            <p className="font-medium">{formData.vehicleInfo || 'Non renseigné'}</p>
                        </div>
                    </div>
                </div>

                {/* Détails du RDV */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-neutral-dark mb-3">Rendez-vous</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600">Date :</span>
                            <p className="font-medium">{formattedDateForDisplay}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Heure :</span>
                            <p className="font-medium">
                                {formData.startTime ? formData.startTime.substring(0, 5) : 'N/A'} - {
                                    formData.startTime && selectedServices.length > 0
                                        ? (() => {
                                            const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
                                            const [hours, minutes] = formData.startTime.split(':').map(Number);
                                            const startMinutes = hours * 60 + minutes;
                                            const endMinutes = startMinutes + totalDuration;
                                            const endHours = Math.floor(endMinutes / 60);
                                            const endMins = endMinutes % 60;
                                            return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                                        })()
                                        : formData.endTime ? formData.endTime.substring(0, 5) : 'N/A'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Services */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-neutral-dark mb-3">Services</h4>
                    {selectedServices.map((service, index) => (
                        <div key={index} className="border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                            <div>
                                <p className="font-medium">{service.serviceName}</p>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Service de base:</span>
                                        <span className="font-medium">{service.basePrice}€, {formatDuration(service.baseDuration)}</span>
                                    </div>
                                    {service.formulaId && service.formulaId !== 'default' && (
                                        <div className="flex justify-between">
                                            <span>Formule: {service.formulaName}</span>
                                            <span className="font-medium">
                                                +{service.formulaPrice}€, +{formatDuration(service.formulaDuration)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Taille: {service.vehicleSizeName}</span>
                                        <span className="font-medium">
                                            {service.vehicleSizePrice > 0 ?
                                                `+${service.vehicleSizePrice}€, +${formatDuration(service.vehicleSizeDuration)}` :
                                                'Standard'
                                            }
                                        </span>
                                    </div>
                                    {service.addOns && service.addOns.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600">Add-ons :</p>
                                            <ul className="text-sm text-gray-600 ml-4 space-y-1">
                                                {service.addOns.map((addon: any, addonIndex: number) => (
                                                    <li key={addonIndex} className="flex justify-between">
                                                        <span>• {addon.name}</span>
                                                        <span className="font-medium">+{addon.price}€, +{formatDuration(addon.duration)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Total intégré dans la section services */}
                    <div className="mt-4 pt-3">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-neutral-dark">Total</span>
                            <div className="text-right">
                                <p className="font-bold text-xl text-blue-600">
                                    {selectedServices.reduce((sum, s) => sum + s.totalPrice, 0)}€
                                </p>
                                <p className="text-sm text-gray-600">
                                    {formatDuration(selectedServices.reduce((sum, s) => sum + s.duration, 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        );
    };


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

                <div className="overflow-y-auto p-6">
                    {/* Mode récapitulatif pour les réservations existantes */}
                    <ReservationSummary />

                    {/* Mode formulaire (nouvelle réservation ou édition) */}
                    {(!isEditing || isEditMode) && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Affichage des erreurs de validation */}
                            {validationError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                Erreur de validation
                                            </h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                {validationError}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* 1. Services Selection - First */}
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
                                                        schedule={shopData.schedule || defaultSchedule}
                                                        serviceDuration={calculateTotalDuration()}
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
                                                            schedule={shopData.schedule || defaultSchedule}
                                                            serviceDuration={calculateTotalDuration()}
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
                                                    disabled={!formData.start_time}
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
                                                    <p className="text-2xl font-bold text-primary mt-1">{formData.start_time}</p>
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
                                        <select name="status" value={formData.status || 'upcoming'} onChange={handleInputChange} className="form-input">
                                            <option value="upcoming">{t.status_upcoming}</option>
                                            <option value="completed">{t.status_completed}</option>
                                            <option value="cancelled">{t.status_cancelled}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Client Information Section */}
                            <div>
                                <h3 className="font-bold text-neutral-dark mb-4">{t.clientInformation}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="form-label">Nom du client</label>
                                        <input
                                            name="customerName"
                                            value={formData.customerName || ''}
                                            onChange={handleInputChange}
                                            placeholder={t.clientName}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Email</label>
                                        <input
                                            name="customerEmail"
                                            type="email"
                                            value={formData.customerEmail || ''}
                                            onChange={handleInputChange}
                                            placeholder={t.clientEmail}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Téléphone</label>
                                        <input
                                            name="customerPhone"
                                            type="tel"
                                            value={formData.customerPhone || ''}
                                            onChange={handleInputChange}
                                            placeholder={t.clientPhone}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Véhicule</label>
                                        <input
                                            name="vehicleInfo"
                                            type="text"
                                            value={formData.vehicleInfo || ''}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Peugeot 308 blanche - AB-123-CD"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <footer className="flex justify-between items-center p-4 border-t mt-auto">
                    <div>
                        {isEditing && (
                            <button type="button" onClick={handleDelete} className="text-red-600 font-semibold hover:underline flex items-center gap-2">
                                <TrashIcon className="w-5 h-5" /> {t.deleteReservation}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        {isEditing && !isEditMode ? (
                            // Mode lecture : seulement Fermer
                            <button type="button" onClick={onClose} className="btn btn-secondary">{t.close}</button>
                        ) : (
                            // Mode édition : Annuler et Sauvegarder
                            <>
                                <button type="button" onClick={onClose} className="btn btn-secondary">{t.cancel}</button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={!isEditing && (!formData.start_time || selectedServices.length === 0)}
                                    className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SaveIcon className="w-4 h-4" />
                                    {isEditing ? t.saveChanges : t.createReservation}
                                </button>
                            </>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ReservationEditor;
