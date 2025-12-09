'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Calendar from './Calendar'; // Import Custom Calendar

interface DatePickerProps {
    value?: string; // YYYY-MM-DD string
    onChange?: (e: { target: { value: string } }) => void; // Mimic event structure for compatibility
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export default function DatePicker({ value, onChange, className, placeholder, disabled }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateSelect = (date: Date) => {
        // Format to YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        onChange?.({ target: { value: formatted } });
        setIsOpen(false);
    };

    const displayDate = value ? new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }) : '';

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    "w-full pl-3 pr-10 py-2 border rounded text-sm transition-all font-medium flex items-center h-[38px] cursor-pointer bg-white relative",
                    isOpen
                        ? "border-primary-500 ring-1 ring-primary-500"
                        : "border-warmgray-300 hover:border-warmgray-400",
                    disabled && "bg-gray-100 cursor-not-allowed opacity-75 pointer-events-none"
                )}
            >
                <span className={cn("text-warmgray-900", !value && "text-warmgray-400 font-normal")}>
                    {displayDate || placeholder || "Pilih Tanggal"}
                </span>

                <button
                    type="button"
                    className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-warmgray-400 hover:text-primary-600 transition-colors"
                >
                    <CalendarIcon className="h-4 w-4" />
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-[9999] shadow-xl rounded-lg">
                    <Calendar
                        value={value ? new Date(value) : undefined}
                        onChange={handleDateSelect}
                    />
                </div>
            )}
        </div>
    );
}
