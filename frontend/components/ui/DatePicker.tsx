'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Calendar from './Calendar';

interface DatePickerProps {
    value?: string; // YYYY-MM-DD string
    onChange?: (e: { target: { value: string } }) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export default function DatePicker({ value, onChange, className, placeholder, disabled }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    // inputValue will store DD-MM-YYYY format
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Format YYYY-MM-DD (prop) to DD-MM-YYYY (display)
    useEffect(() => {
        if (value) {
            const [year, month, day] = value.split('-');
            if (year && month && day) {
                setInputValue(`${day}-${month}-${year}`);
            } else {
                setInputValue(value); // Fallback
            }
        } else {
            setInputValue('');
        }
    }, [value]);

    // Update coordinates when dropdown opens
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const updateCoords = () => {
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    setCoords({
                        top: rect.bottom + window.scrollY + 4,
                        left: rect.left + window.scrollX
                    });
                }
            };
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
            return () => {
                window.removeEventListener('resize', updateCoords);
                window.removeEventListener('scroll', updateCoords, true);
            };
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const calendarEl = document.getElementById('datepicker-calendar-portal');

            if (containerRef.current && !containerRef.current.contains(target)) {
                if (isOpen && calendarEl && calendarEl.contains(target)) {
                    return;
                }
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleDateSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Internal value: YYYY-MM-DD
        const formattedISO = `${year}-${month}-${day}`;
        onChange?.({ target: { value: formattedISO } });

        // Display value: DD-MM-YYYY (will be updated by useEffect, but we set it here for instant feedback)
        // setInputValue(`${day}-${month}-${year}`); // optional since useEffect handles it

        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        // Allow only numbers and dashes
        val = val.replace(/[^0-9-]/g, '');

        // Split logic for strict validation
        // Pattern expected: DD-MM-YYYY
        const parts = val.split('-');
        let cleanVal = val;

        if (parts.length > 0) {
            let day = parts[0];
            // Limit Day to 2 chars
            if (day.length > 2) day = day.substring(0, 2);
            // Limit Day value to 31
            if (parseInt(day) > 31) day = '31';
            if (day.length === 2 && parseInt(day) === 0) day = '01';

            cleanVal = day;

            if (parts.length > 1 || (val.endsWith('-') && day.length === 2)) { // Auto add dash maybe? user typed dash
                if (val.includes('-')) {
                    cleanVal += '-';
                    let month = parts[1] || '';
                    if (month.length > 2) month = month.substring(0, 2);
                    if (parseInt(month) > 12) month = '12';
                    if (month.length === 2 && parseInt(month) === 0) month = '01';

                    cleanVal += month;

                    if (parts.length > 2 || (val.endsWith('-') && (val.indexOf('-') !== val.lastIndexOf('-')))) {
                        if (val.lastIndexOf('-') > val.indexOf('-')) {
                            cleanVal += '-';
                            let year = parts[2] || '';
                            if (year.length > 4) year = year.substring(0, 4);
                            cleanVal += year;
                        }
                    }
                }
            }
        }

        setInputValue(cleanVal);

        // Validation for updating value prop (must reach full DD-MM-YYYY)
        const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
        const match = cleanVal.match(regex);
        if (match) {
            const d = parseInt(match[1]);
            const m = parseInt(match[2]);
            const y = parseInt(match[3]);

            // Check valid JS date
            const date = new Date(y, m - 1, d);
            if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
                const formattedISO = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                onChange?.({ target: { value: formattedISO } });
            }
        }
    };

    const toggleCalendar = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const calendarDropdown = isOpen && mounted ? (
        <div
            id="datepicker-calendar-portal"
            className="fixed z-[99999] shadow-xl rounded-lg"
            style={{
                top: coords.top,
                left: coords.left
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Calendar
                value={value ? new Date(value) : undefined}
                onChange={handleDateSelect}
            />
        </div>
    ) : null;

    return (
        <div className={cn("relative w-full h-[38px]", className)} ref={containerRef}>
            <div className={cn(
                "flex items-center w-full h-full border rounded transition-all bg-white overflow-hidden shadow-sm",
                isOpen ? "border-primary-500 ring-1 ring-primary-500" : "border-warmgray-300 hover:border-warmgray-400",
                disabled && "bg-gray-100 cursor-not-allowed opacity-75"
            )}>
                {/* Manual Input Area */}
                <input
                    type="text"
                    className={cn(
                        "flex-1 h-full px-3 text-sm font-medium text-warmgray-900 placeholder:text-warmgray-400 focus:outline-none min-w-0 tracking-wide",
                        disabled && "cursor-not-allowed bg-transparent"
                    )}
                    placeholder={placeholder || "DD-MM-YYYY"}
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={disabled}
                    maxLength={10} // DD-MM-YYYY = 10 chars
                    onClick={(e) => e.stopPropagation()}
                />

                {/* Calendar Icon Button */}
                <button
                    type="button"
                    onClick={toggleCalendar}
                    className={cn(
                        "h-full px-3 flex items-center justify-center border-l border-warmgray-200 bg-gray-50 hover:bg-white text-warmgray-500 hover:text-primary-600 transition-all cursor-pointer",
                        disabled && "cursor-not-allowed hover:bg-gray-50 hover:text-warmgray-500"
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className={cn("h-4 w-4 transition-colors", isOpen && "text-primary-600")} />
                </button>
            </div>

            {mounted && createPortal(calendarDropdown, document.body)}
        </div>
    );
}
