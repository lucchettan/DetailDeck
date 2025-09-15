
import React, { useState, useMemo } from 'react';

// Helper to get the number of days in a month
const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// Helper to get the first day of the month (0=Sun, 1=Mon, ...)
const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const getAvailableSlotsForDay = (date: Date, schedule: any, serviceDuration: number): string[] => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[date.getDay()];
    const daySchedule = schedule[dayOfWeek];

    if (!daySchedule || !daySchedule.isOpen) {
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
            currentTime += 15; // check every 15 mins
        }
    });

    return availableSlots;
};


interface CalendarProps {
    schedule: any;
    serviceDuration: number;
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ schedule, serviceDuration, selectedDate, onSelectDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const numDays = daysInMonth(year, month);
    let firstDay = firstDayOfMonth(year, month);
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust to make Monday the first day (0=Mon)

    const disabledDays = useMemo(() => {
        const disabled = new Set<number>();
        for (let day = 1; day <= numDays; day++) {
            const date = new Date(year, month, day);
            if (getAvailableSlotsForDay(date, schedule, serviceDuration).length === 0) {
                disabled.add(day);
            }
        }
        return disabled;
    }, [year, month, numDays, schedule, serviceDuration]);


    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };
    
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="bg-white rounded-lg p-4 border">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="px-2 py-1 rounded-md hover:bg-gray-100">&larr;</button>
                <h3 className="font-bold text-lg">{monthName} {year}</h3>
                <button onClick={handleNextMonth} className="px-2 py-1 rounded-md hover:bg-gray-100">&rarr;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500">
                {weekDays.map(day => <div key={day} className="font-semibold">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: numDays }).map((_, day) => {
                    const dayNumber = day + 1;
                    const isSelected = selectedDate && selectedDate.getDate() === dayNumber && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                    const isDisabled = disabledDays.has(dayNumber);
                    
                    return (
                        <button
                            key={dayNumber}
                            onClick={() => !isDisabled && onSelectDate(new Date(year, month, dayNumber))}
                            disabled={isDisabled}
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
