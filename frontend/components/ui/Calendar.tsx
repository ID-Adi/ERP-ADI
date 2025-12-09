'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
    value?: Date;
    onChange: (date: Date) => void;
    className?: string;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function Calendar({ value, onChange, className }: CalendarProps) {
    const [viewDate, setViewDate] = useState(value || new Date());

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onChange(newDate);
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Previous month filler days
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    const prevMonthDays = Array.from({ length: firstDay }, (_, i) => daysInPrevMonth - firstDay + 1 + i);

    const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!value) return false;
        return day === value.getDate() && month === value.getMonth() && year === value.getFullYear();
    };

    return (
        <div className={cn("p-3 bg-white rounded-lg shadow-lg border border-warmgray-200 w-64", className)}>
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => changeMonth(-1)}
                    type="button"
                    className="p-1 hover:bg-warmgray-100 rounded text-warmgray-600 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="font-semibold text-sm text-warmgray-800">
                    {MONTHS[month]} {year}
                </div>
                <button
                    onClick={() => changeMonth(1)}
                    type="button"
                    className="p-1 hover:bg-warmgray-100 rounded text-warmgray-600 transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map(day => (
                    <div key={day} className="text-center text-xs text-warmgray-500 font-medium py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {prevMonthDays.map(day => (
                    <div key={`prev-${day}`} className="h-8 flex items-center justify-center text-xs text-warmgray-300">
                        {day}
                    </div>
                ))}

                {currentDays.map(day => (
                    <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        type="button"
                        className={cn(
                            "h-8 w-8 flex items-center justify-center text-sm rounded-full transition-all",
                            isSelected(day)
                                ? "bg-primary-600 text-white hover:bg-primary-700"
                                : isToday(day)
                                    ? "text-primary-600 font-bold hover:bg-primary-50"
                                    : "text-warmgray-700 hover:bg-warmgray-100"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
}
