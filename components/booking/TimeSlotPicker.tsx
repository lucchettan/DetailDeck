
import React, { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { toYYYYMMDD, getBookingBoundaries } from '../../lib/utils';
import { IS_MOCK_MODE } from '../../lib/env';

// FIX: Added a guard to prevent crash if time is not a valid string.
const timeToMinutes = (time: string) => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

interface ExistingReservation {
    start_time: string;
    total_duration: number; // in minutes
}

interface TimeSlotPickerProps {
    shopId: string;
    selectedDate: Date | null;
    selectedTimeSlot: string;
    onTimeSlotSelect: (time: string) => void;
    duration: number;
    minNoticeHours?: number;
    maxBookingHorizon?: number; // Nombre de semaines
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ shopId, selectedDate, selectedTimeSlot, onTimeSlotSelect, duration, minNoticeHours = 0, maxBookingHorizon }) => {
    const { t } = useLanguage();
    const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReservationsForDay = async () => {
            if (!selectedDate || duration <= 0) {
                setExistingReservations([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            if (IS_MOCK_MODE) {
                // Mock mode: simulate some existing reservations
                const mockReservations: ExistingReservation[] = [
                    { start_time: '10:00', total_duration: 90 },
                    { start_time: '14:30', total_duration: 60 }
                ];
                setExistingReservations(mockReservations);
                setIsLoading(false);
                return;
            }

            const dateString = toYYYYMMDD(selectedDate);

            const { data, error } = await supabase
                .from('reservations')
                .select('start_time, total_duration')
                .eq('shop_id', shopId)
                .eq('date', dateString)
                .neq('status', 'cancelled');

            if (error) {
                console.error("Error fetching reservations for day:", error);
                setExistingReservations([]);
            } else {
                console.log('🔍 Reservations found for', dateString, ':', data);
                setExistingReservations(data as ExistingReservation[]);
            }
            setIsLoading(false);
        };
        fetchReservationsForDay();
    }, [selectedDate, shopId, duration]);


    const availableSlots = useMemo(() => {
        if (!selectedDate || duration <= 0) {
            console.log('🔍 TimeSlotPicker: No date or invalid duration', { selectedDate, duration });
            return [];
        }

        // Vérifier l'horizon maximum de réservation
        const today = new Date();
        const maxBookingDate = new Date(today);

        if (maxBookingHorizon && typeof maxBookingHorizon === 'number') {
            const horizonDays = maxBookingHorizon * 7; // Convertir semaines en jours
            maxBookingDate.setDate(today.getDate() + horizonDays);

            if (selectedDate > maxBookingDate) {
                console.log('🔍 TimeSlotPicker: Date exceeds max booking horizon', { selectedDate, maxBookingDate, maxBookingHorizon, horizonDays });
                return [];
            }
        }

        console.log('🔍 TimeSlotPicker: Generating slots for', {
            selectedDate,
            duration,
            minNoticeHours,
            minNoticeHoursType: typeof minNoticeHours,
            maxBookingHorizon,
            maxBookingHorizonType: typeof maxBookingHorizon,
            isToday: toYYYYMMDD(selectedDate) === toYYYYMMDD(new Date())
        });

        // Horaires par défaut (9h-18h)
        const startTime = 9 * 60; // 9h00 en minutes
        const endTime = 18 * 60; // 18h00 en minutes

        const initialSlots: string[] = [];
        let currentTime = startTime;

        // Vérifier si c'est aujourd'hui pour éviter les créneaux passés et respecter le délai minimum
        const isToday = toYYYYMMDD(selectedDate) === toYYYYMMDD(new Date());
        if (isToday) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            // Ajouter le délai minimum en minutes (avec valeur par défaut de 0 si undefined)
            const minNoticeMinutes = (minNoticeHours || 0) * 60;
            const earliestAllowedTime = currentMinutes + minNoticeMinutes;

            // S'assurer que le currentTime respecte le délai minimum
            const minTimeWithNotice = Math.ceil(earliestAllowedTime / 15) * 15;
            currentTime = Math.max(currentTime, minTimeWithNotice);

            console.log(`🕐 Min notice: ${minNoticeHours || 0}h (${minNoticeMinutes}min), Current: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}, Earliest allowed: ${Math.floor(earliestAllowedTime / 60)}:${(earliestAllowedTime % 60).toString().padStart(2, '0')}, First slot: ${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`);
        }

        while (currentTime + duration <= endTime && !isNaN(currentTime)) {
            const hours = Math.floor(currentTime / 60).toString().padStart(2, '0');
            const minutes = (currentTime % 60).toString().padStart(2, '0');
            initialSlots.push(`${hours}:${minutes}`);
            currentTime += 15; // Booking interval of 15 minutes
        }

        if (!existingReservations || existingReservations.length === 0) {
            return initialSlots;
        }

        const reservationIntervals = existingReservations.map(res => {
            const start = timeToMinutes(res.start_time);
            return { start, end: start + (res.total_duration || 0) };
        });

        console.log('🔍 Reservation intervals:', reservationIntervals);
        console.log('🔍 Service duration:', duration);

        const filteredSlots = initialSlots.filter(slot => {
            const slotStart = timeToMinutes(slot);
            const slotEnd = slotStart + duration;

            // Check for overlap with any existing reservation
            const hasOverlap = reservationIntervals.some(interval =>
                slotStart < interval.end && slotEnd > interval.start
            );

            if (hasOverlap) {
                console.log(`❌ Slot ${slot} conflicts with existing reservation`);
            }

            return !hasOverlap;
        });

        console.log('🔍 Available slots after filtering:', filteredSlots);
        return filteredSlots;

    }, [selectedDate, duration, existingReservations, minNoticeHours, maxBookingHorizon]);

    if (isLoading) {
        return <div className="text-center p-4 bg-gray-50 rounded-lg">Chargement des créneaux...</div>;
    }

    if (availableSlots.length === 0) {
        return <div className="text-center p-4 bg-gray-50 rounded-lg">Aucun créneau disponible</div>;
    }

    return (
        <div className="grid grid-cols-3 gap-2">
            {availableSlots.map(time => (
                <button
                    key={time}
                    type="button"
                    onClick={() => onTimeSlotSelect(time)}
                    className={`p-2 rounded-lg border-2 font-semibold transition-colors
                        ${selectedTimeSlot === time ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-900 border-gray-300 hover:border-blue-600'}
                    `}
                >
                    {time}
                </button>
            ))}
        </div>
    );
};

export default TimeSlotPicker;
