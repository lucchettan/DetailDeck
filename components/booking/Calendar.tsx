import React, { useState, useMemo, useEffect } from 'react';
import { getBookingBoundaries } from '../../lib/utils';
import { supabase } from '../../lib/supabaseClient';

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const timeToMinutes = (time: string) => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

interface ExistingReservation {
    start_time: string;
    duration: number;
}

const getAvailableSlotsForDay = (date: Date, schedule: any, serviceDuration: number, existingReservations: ExistingReservation[]): string[] => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[date.getDay()];
    const daySchedule = schedule[dayOfWeek];

    if (!daySchedule || !daySchedule.isOpen || serviceDuration <= 0) {
        return [];
    }

    const availableSlots: string[] = [];
    daySchedule.timeframes.forEach((frame: { from: string, to: string }) => {
        let currentTime = timeToMinutes(frame.from);
        const endTime = timeToMinutes(frame.to);

        while (currentTime + serviceDuration <= endTime) {
            const hours = Math.floor(currentTime / 60).toString().padStart(2, '0');
            const minutes = (currentTime % 60).toString().padStart(2, '0');
            availableSlots.push(`${hours}:${minutes}`);
            currentTime += 15;
        }
    });
    
    if (!existingReservations || existingReservations.length === 0) {
        return availableSlots;
    }

    const reservationIntervals = existingReservations.map(res => {
        const start = timeToMinutes(res.start_time);
        return { start, end: start + res.duration };
    });

    return availableSlots.filter(slot => {
        const slotStart = timeToMinutes(slot);
        const slotEnd = slotStart + serviceDuration;
        return !reservationIntervals.some(interval => slotStart < interval.end && slotEnd > interval.start);
    });
};


interface CalendarProps {
    shopId: string;
    schedule: any;
    serviceDuration: number;
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
    minBookingNotice: string;
    maxBookingHorizon: string;
    disableBounds?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ shopId, schedule, serviceDuration, selectedDate, onSelectDate, minBookingNotice, maxBookingHorizon, disableBounds }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [monthlyReservations, setMonthlyReservations] = useState<Record<string, ExistingReservation[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const { minDate, maxDate } = useMemo(
        () => disableBounds 
             ? { minDate: new Date(0), maxDate: new Date(8640000000000000) } 
             : getBookingBoundaries(minBookingNotice, maxBookingHorizon),
        [minBookingNotice, maxBookingHorizon, disableBounds]
    );

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    useEffect(() => {
        const fetchMonthlyReservations = async () => {
            if (serviceDuration <= 0) return;
            setIsLoading(true);
            const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
            const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('reservations')
                .select('date, start_time, duration')
                .eq('shop_id', shopId)
                .gte('date', firstDay)
                .lte('date', lastDay);

            if (error) {
                console.error("Error fetching monthly reservations:", error);
            } else {
                const grouped = data.reduce((acc, res) => {
                    const date = res.date;
                    if (!acc[date]) acc[date] = [];
                    acc[date].push({ start_time: res.start_time, duration: res.duration });
                    return acc;
                }, {} as Record<string, ExistingReservation[]>);
                setMonthlyReservations(grouped);
            }
            setIsLoading(false);
        };
        fetchMonthlyReservations();
    }, [year, month, shopId, serviceDuration]);


    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const numDays = daysInMonth(year, month);
    let firstDayIndex = firstDayOfMonth(year, month);
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const disabledDays = useMemo(() => {
        const disabled = new Set<number>();
        for (let day = 1; day <= numDays; day++) {
            const date = new Date(year, month, day);
            date.setHours(0,0,0,0);
            
            if (date < minDate || date > maxDate) {
                 disabled.add(day);
                 continue;
            }
            
            const dateString = date.toISOString().split('T')[0];
            const dayReservations = monthlyReservations[dateString] || [];
            
            if (getAvailableSlotsForDay(date, schedule, serviceDuration, dayReservations).length === 0) {
                disabled.add(day);
            }
        }
        return disabled;
    }, [year, month, numDays, schedule, serviceDuration, minDate, maxDate, monthlyReservations]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };
    
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="bg-white rounded-lg p-4 border relative">
            {isLoading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div></div>}
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="px-2 py-1 rounded-md hover:bg-gray-100">&larr;</button>
                <h3 className="font-bold text-lg">{monthName} {year}</h3>
                <button onClick={handleNextMonth} className="px-2 py-1 rounded-md hover:bg-gray-100">&rarr;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500">
                {weekDays.map(day => <div key={day} className="font-semibold">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: numDays }).map((_, day) => {
                    const dayNumber = day + 1;
                    const isSelected = selectedDate && selectedDate.getDate() === dayNumber && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                    const isDisabled = disabledDays.has(dayNumber);
                    
                    return (
                        <button
                            key={dayNumber}
                            onClick={() => !isDisabled && onSelectDate(new Date(year, month, dayNumber))}
                            disabled={isDisabled || isLoading}
                            className={`w-10 h-10 rounded-full transition-colors flex items-center justify-center
                                ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-100'}
                                ${isSelected ? 'bg-brand-blue text-white' : ''}
                            `}
                        >
                            {dayNumber}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;