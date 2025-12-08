'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface Option {
    value: string;
    label: string;
    description?: string; // For secondary text like code
}

export interface SearchableSelectProps {
    options: Option[];
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    helperText?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
}

const SearchableSelect = forwardRef<HTMLDivElement, SearchableSelectProps>(
    ({ options, value, onChange, label, placeholder = 'Pilih...', error, helperText, className, required, disabled }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const containerRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);

        const selectedOption = options.find(opt => opt.value === value);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        // Filter options based on search
        const filteredOptions = options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        const handleSelect = (optionValue: string) => {
            onChange(optionValue);
            setIsOpen(false);
            setSearchQuery(''); // Reset search
        };

        return (
            <div className={cn("w-full", className)} ref={containerRef}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                        {required && <span className="text-danger-600 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    <div
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        className={cn(
                            "flex items-center justify-between w-full px-3 py-2 border rounded-lg bg-white cursor-pointer transition-colors",
                            "hover:bg-gray-50",
                            isOpen ? "ring-2 ring-primary-500 border-transparent" : "border-gray-300",
                            error ? "border-danger-500" : "",
                            disabled ? "bg-gray-100 cursor-not-allowed opacity-75" : ""
                        )}
                    >
                        <span className={cn("block truncate", !selectedOption && "text-gray-400")}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "transform rotate-180")} />
                    </div>

                    {isOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-hidden">
                            <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                                <Search className="h-4 w-4 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-400"
                                    placeholder="Cari..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {searchQuery && (
                                    <button onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            <div className="overflow-auto flex-1 py-1">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            onClick={() => handleSelect(option.value)}
                                            className={cn(
                                                "px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-primary-50 hover:text-primary-700",
                                                value === option.value ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700"
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{option.label}</span>
                                                {option.description && (
                                                    <span className="text-xs text-gray-500">{option.description}</span>
                                                )}
                                            </div>
                                            {value === option.value && <Check className="h-4 w-4 text-primary-600" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                        Tidak ditemukan
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <p className="mt-1 text-sm text-danger-600">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

SearchableSelect.displayName = 'SearchableSelect';

export default SearchableSelect;
