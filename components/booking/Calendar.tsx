


import React, { useState, useMemo, useEffect } from 'react';
import { getBookingBoundaries, toYYYYMMDD } from '../../lib/utils';

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

interface CalendarProps {
    shopId: string;
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ shopId, selectedDate, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Dates limites simples (aujourd'hui + 30 jours)
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const numDays = daysInMonth(year, month);
    let firstDayIndex = firstDayOfMonth(year, month);
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const disabledDays = useMemo(() => {
        const disabled = new Set<number>();

        for (let day = 1; day <= numDays; day++) {
            const dayToCheckStart = new Date(year, month, day);
            dayToCheckStart.setHours(0, 0, 0, 0);
            const dayToCheckEnd = new Date(year, month, day);
            dayToCheckEnd.setHours(23, 59, 59, 999);

            // A day is disabled if its end is before the first bookable moment,
            // or its start is after the last bookable moment.
            if (dayToCheckEnd < minDate || dayToCheckStart > maxDate) {
                disabled.add(day);
            }
        }
        return disabled;
    }, [year, month, numDays, minDate, maxDate]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="bg-white rounded-lg p-4 border relative">
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={handlePrevMonth} className="px-2 py-1 rounded-md hover:bg-gray-100">&larr;</button>
                <h3 className="font-bold text-lg">{monthName} {year}</h3>
                <button type="button" onClick={handleNextMonth} className="px-2 py-1 rounded-md hover:bg-gray-100">&rarr;</button>
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
                            type="button"
                            onClick={() => !isDisabled && onDateSelect(new Date(year, month, dayNumber))}
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
