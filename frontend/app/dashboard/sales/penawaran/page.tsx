'use client';

import PenawaranView from '@/components/views/sales/PenawaranView';

export default function QuotationsPage() {
    return <PenawaranView />;
}

function FilterButton({ label, value }: { label: string, value: string }) {
    return (
        <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs hover:bg-surface-200 transition-colors whitespace-nowrap">
            <span className="text-warmgray-500">{label}:</span>
            <span className="font-semibold text-warmgray-700">{value}</span>
            <ChevronDown className="h-3 w-3 text-warmgray-400" />
        </button>
    )
}

function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <th scope="col" className={cn("px-4 py-2.5 font-semibold whitespace-nowrap cursor-pointer hover:bg-warmgray-700 transition-colors", className)}>
            <div className="flex items-center gap-1">
                {children}

            </div>
        </th>
    )
}
