'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
    code: string;
    name: string;
    phone?: string;
    address?: string;
}

interface CustomerSelectProps {
    value: string;
    onChange: (value: string) => void;
    customers: Customer[];
    placeholder?: string;
}

export default function CustomerSelect({ value, onChange, customers, placeholder = "Cari/Pilih Pelanggan..." }: CustomerSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    // Use ref to store customers to avoid dependency issues
    const customersRef = useRef<Customer[]>(customers);
    customersRef.current = customers;

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update internal search query when value changes externally or selected
    useEffect(() => {
        const selected = customers.find(c => c.code === value);
        if (selected) {
            // Only update if not open to avoid disrupting typing
            if (!isOpen) setSearchQuery(selected.name);
        } else {
            if (!isOpen) setSearchQuery('');
        }
    }, [value, isOpen, customers]);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery))
    );

    const handleSelect = (code: string) => {
        onChange(code);
        const selected = customers.find(c => c.code === code);
        if (selected) setSearchQuery(selected.name);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setIsOpen(true);
        if (e.target.value === '') {
            onChange(''); // Clear selection if input cleared
        }
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {/* Input Area */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className={cn(
                        "w-full pl-3 pr-10 py-2 border rounded text-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary-500 h-[38px] min-h-[38px] max-h-[38px]",
                        isOpen ? "border-primary-400 ring-1 ring-primary-400" : "border-warmgray-300"
                    )}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-warmgray-400 pointer-events-none">
                    {isOpen ? <Search className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-surface-300 rounded shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.length > 0 ? (
                        <ul className="py-1">
                            {filteredCustomers.slice(0, 50).map((customer) => (
                                <li
                                    key={customer.code}
                                    onClick={() => handleSelect(customer.code)}
                                    className={cn(
                                        "px-3 py-2 cursor-pointer hover:bg-primary-50 border-b border-surface-100 last:border-0",
                                        value === customer.code ? "bg-primary-50" : ""
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-warmgray-900 text-sm">{customer.name}</span>
                                        <span className="text-xs text-warmgray-500">{customer.code}</span>
                                    </div>
                                    <div className="text-xs text-warmgray-500 mt-0.5">
                                        {customer.phone ? `HP:${customer.phone}` : 'No Phone'}
                                        {customer.address && ` • ${customer.address}`}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-3 py-4 text-center text-sm text-warmgray-500">
                            Tidak ada hasil ditemukan
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
