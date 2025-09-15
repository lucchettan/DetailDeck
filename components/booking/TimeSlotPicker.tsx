

import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

interface ExistingReservation {
    start_time: string;
    duration: number; // in minutes
}

interface TimeSlotPickerProps {
    schedule: any;
    serviceDuration: number;
    selectedDate: Date;
    selectedTime: string | null;
    onSelectTime: (time: string) => void;
    existingReservations: ExistingReservation[];
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ schedule, serviceDuration, selectedDate, selectedTime, onSelectTime, existingReservations }) => {
    const { t } = useLanguage();

    const availableSlots = useMemo(() => {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = dayNames[selectedDate.getDay()];
        const daySchedule = schedule[dayOfWeek];

        if (!daySchedule || !daySchedule.isOpen) {
            return [];
        }

        const initialSlots: string[] = [];
        daySchedule.timeframes.forEach((frame: { from: string, to: string }) => {
            let currentTime = timeToMinutes(frame.from);
            const endTime = timeToMinutes(frame.to);

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

    }, [selectedDate, schedule, serviceDuration, existingReservations]);

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