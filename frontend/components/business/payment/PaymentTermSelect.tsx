import { useEffect, useState } from 'react';
import { paymentTermApi, PaymentTerm } from '@/lib/api/paymentTerms';

interface PaymentTermSelectProps {
    value?: string;
    onChange: (value: string, days?: number) => void;
    className?: string;
    disabled?: boolean;
}

import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PaymentTermSelect({ value, onChange, className = '', disabled = false }: PaymentTermSelectProps) {
    const [terms, setTerms] = useState<PaymentTerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadTerms();
    }, []);

    const loadTerms = async () => {
        try {
            const data = await paymentTermApi.getAll();
            setTerms(data);
        } catch (error) {
            console.error('Failed to load payment terms', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (term: PaymentTerm) => {
        onChange(term.id, term.days);
        setIsOpen(false);
    };

    const selectedTerm = terms.find(t => t.id === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || loading}
                className={cn(
                    "w-full px-3 py-2 border rounded-lg bg-white flex items-center justify-between text-sm transition-all text-warmgray-900",
                    isOpen ? "ring-1 ring-primary-500 border-primary-500" : "border-warmgray-300 hover:bg-warmgray-50",
                    (disabled || loading) && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <span className={!selectedTerm ? "text-warmgray-400" : ""}>
                    {selectedTerm ? `${selectedTerm.name} (${selectedTerm.days} Hari)` : "Pilih Syarat Pembayaran"}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-warmgray-400 transition-transform", isOpen && "transform rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-warmgray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                        {terms.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-warmgray-500 text-center">
                                Tidak ada data
                            </div>
                        ) : (
                            <div className="py-1">
                                {terms.map((term) => (
                                    <button
                                        key={term.id}
                                        type="button"
                                        onClick={() => handleSelect(term)}
                                        className={cn(
                                            "w-full px-3 py-2 text-sm text-left hover:bg-warmgray-50 flex items-center justify-between group",
                                            value === term.id && "bg-primary-50 text-primary-700 font-medium"
                                        )}
                                    >
                                        <span>{term.name} <span className="text-warmgray-400 text-xs ml-1">({term.days} Hari)</span></span>
                                        {value === term.id && <Check className="h-4 w-4 text-primary-600" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
