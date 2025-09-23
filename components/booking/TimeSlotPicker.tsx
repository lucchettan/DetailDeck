
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
    duration: number; // in minutes
}

// FIX: Updated props to accept shopId and fetch its own data, removing the dependency on a passed-in reservations list.
interface TimeSlotPickerProps {
    shopId: string;
    schedule: any;
    serviceDuration: number;
    selectedDate: Date;
    selectedTime: string | null;
    onSelectTime: (time: string) => void;
    editingReservationId?: string;
    minBookingNotice: string;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ shopId, schedule, serviceDuration, selectedDate, selectedTime, onSelectTime, editingReservationId, minBookingNotice }) => {
    const { t } = useLanguage();
    const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReservationsForDay = async () => {
            if (!selectedDate || serviceDuration <= 0) {
                setExistingReservations([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            if (IS_MOCK_MODE) {
                // Mock mode: simulate some existing reservations
                const mockReservations: ExistingReservation[] = [
                    { start_time: '10:00', duration: 90 },
                    { start_time: '14:30', duration: 60 }
                ];
                setExistingReservations(mockReservations);
                setIsLoading(false);
                return;
            }

            const dateString = toYYYYMMDD(selectedDate);

            let query = supabase
                .from('reservations')
                .select('start_time, duration')
                .eq('shop_id', shopId)
                .eq('date', dateString)
                .neq('status', 'cancelled');

            if (editingReservationId) {
                query = query.neq('id', editingReservationId);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching reservations for day:", error);
                setExistingReservations([]);
            } else {
                setExistingReservations(data as ExistingReservation[]);
            }
            setIsLoading(false);
        };
        fetchReservationsForDay();
    }, [selectedDate, shopId, serviceDuration, editingReservationId]);


    const availableSlots = useMemo(() => {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = dayNames[selectedDate.getDay()];
        const daySchedule = schedule[dayOfWeek];

        if (!daySchedule || !daySchedule.isOpen || serviceDuration <= 0) {
            return [];
        }

        const { minDate } = getBookingBoundaries(minBookingNotice, '0w');
        const isToday = toYYYYMMDD(selectedDate) === toYYYYMMDD(new Date());

        const initialSlots: string[] = [];
        daySchedule.timeframes.forEach((frame: { from: string, to: string }) => {
            let currentTime = timeToMinutes(frame.from);
            const endTime = timeToMinutes(frame.to);

            if (isToday) {
                const minTimeToday = minDate.getHours() * 60 + minDate.getMinutes();
                if (currentTime < minTimeToday) {
                    currentTime = Math.ceil(minTimeToday / 15) * 15;
                }
            }

            while (currentTime + serviceDuration <= endTime) {
                const hours = Math.floor(currentTime / 60).toString().padStart(2, '0');
                const minutes = (currentTime % 60).toString().padStart(2, '0');
                initialSlots.push(`${hours}:${minutes}`);
                currentTime += 15; // Booking interval of 15 minutes
            }
        });

        if (!existingReservations || existingReservations.length === 0) {
            return initialSlots;
        }

        const reservationIntervals = existingReservations.map(res => {
            const start = timeToMinutes(res.start_time);
            return { start, end: start + res.duration };
        });

        return initialSlots.filter(slot => {
            const slotStart = timeToMinutes(slot);
            const slotEnd = slotStart + serviceDuration;

            // Check for overlap with any existing reservation
            return !reservationIntervals.some(interval =>
                slotStart < interval.end && slotEnd > interval.start
            );
        });

    }, [selectedDate, schedule, serviceDuration, existingReservations, minBookingNotice]);

    if (isLoading) {
        return <div className="text-center p-4 bg-gray-50 rounded-lg">{t.loadingReservations}</div>;
    }

    if (availableSlots.length === 0) {
        return <div className="text-center p-4 bg-gray-50 rounded-lg">{t.noSlotsAvailable}</div>;
    }

    return (
        <div className="grid grid-cols-3 gap-2">
            {availableSlots.map(time => (
                <button
                    key={time}
                    onClick={() => onSelectTime(time)}
                    className={`p-2 rounded-lg border-2 font-semibold transition-colors
                        ${selectedTime === time ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-brand-dark border-gray-300 hover:border-brand-blue'}
                    `}
                >
                    {time}
                </button>
            ))}
        </div>
    );
};

export default TimeSlotPicker;
