'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    RefreshCw,
    Printer,
    Download,
    ChevronDown,
    Filter,

} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Dummy data
const dummyQuotations = [
    {
        id: '1',
        quoteNumber: 'QO.2024.12.00015',
        customerName: 'PT MAJU JAYA',
        description: 'Penawaran Produk A',
        quoteDate: '2024-11-10',
        validUntil: '2024-12-10',
        salesPerson: 'SC - Santi',
        total: 5500000,
        status: 'Open',
    },
    {
        id: '2',
        quoteNumber: 'QO.2024.12.00016',
        customerName: 'CV BERKAH',
        description: 'Penawaran Jasa',
        quoteDate: '2024-11-08',
        validUntil: '2024-12-08',
        salesPerson: 'SR - Rina',
        total: 3200000,
        status: 'Accepted',
    },
];

export default function PenawaranView() {
    const [quotations] = useState(dummyQuotations);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredQuotations = quotations.filter((q) =>
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden">
            <div className="flex items-center px-4 py-2 border-b border-surface-200 bg-surface-50">
                <span className="text-xs font-semibold text-warmgray-500 uppercase tracking-wider">
                    Sales / Quotations
                </span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-200 bg-white overflow-x-auto">
                <FilterButton label="Date range" value="This Month" />
                <FilterButton label="Customer" value="All" />
                <FilterButton label="Status" value="All" />
                <button className="p-1.5 hover:bg-surface-100 rounded-md text-primary-600">
                    <Filter className="h-4 w-4" />
                </button>
            </div>

            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/sales/penawaran/new">
                        <button className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm transition-colors">
                            <Plus className="h-5 w-5" />
                        </button>
                    </Link>
                    <button className="flex items-center justify-center w-8 h-8 bg-white border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded-md shadow-sm transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-surface-300 rounded-md shadow-sm">
                        <button className="p-1.5 border-r border-surface-200 hover:bg-surface-50 text-warmgray-600">
                            <Download className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 hover:bg-surface-50 text-warmgray-600">
                            <Printer className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-3 pr-10 py-1.5 text-sm bg-white border border-surface-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder:text-warmgray-400"
                        />
                        <div className="absolute right-0 top-0 bottom-0 px-2 flex items-center border-l border-surface-300 bg-surface-50 rounded-r-md">
                            <Search className="h-4 w-4 text-warmgray-400" />
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-surface-200 text-xs font-semibold text-warmgray-700 rounded-md border border-surface-300">
                        {filteredQuotations.length}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-4 py-2.5 font-semibold w-12 text-center">
                                &nbsp;
                            </th>
                            <Th>Quote #</Th>
                            <Th>Date</Th>
                            <Th>Valid Until</Th>
                            <Th>Customer</Th>
                            <Th>Description</Th>
                            <Th>Status</Th>
                            <Th>Sales Person</Th>
                            <Th className="text-right">Total</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200">
                        {filteredQuotations.map((q, index) => (
                            <tr
                                key={q.id}
                                className={cn(
                                    "hover:bg-primary-50 transition-colors cursor-pointer group",
                                    index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                )}
                            >
                                <td className="px-4 py-2 text-center text-warmgray-400">
                                    <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-primary-500" />
                                </td>
                                <td className="px-4 py-2 font-medium text-warmgray-900">{q.quoteNumber}</td>
                                <td className="px-4 py-2 text-warmgray-600 whitespace-nowrap">{formatDate(q.quoteDate)}</td>
                                <td className="px-4 py-2 text-warmgray-600 whitespace-nowrap">{formatDate(q.validUntil)}</td>
                                <td className="px-4 py-2 text-warmgray-900 font-medium">{q.customerName}</td>
                                <td className="px-4 py-2 text-warmgray-600 truncate max-w-[200px]">{q.description}</td>
                                <td className="px-4 py-2">
                                    <span className="font-semibold text-warmgray-700">{q.status}</span>
                                </td>
                                <td className="px-4 py-2 text-warmgray-600">{q.salesPerson}</td>
                                <td className="px-4 py-2 text-right font-bold text-warmgray-900">{formatCurrency(q.total)}</td>
                            </tr>
                        ))}
                        {filteredQuotations.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-4 py-12 text-center text-warmgray-500">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-4 py-2 border-t border-surface-200 bg-surface-50 flex items-center justify-between text-xs text-warmgray-500">
                <span>Showing 1 to {filteredQuotations.length} of {filteredQuotations.length} items</span>
                <div className="flex gap-1">
                    <button className="px-2 py-1 border border-surface-300 rounded hover:bg-white disabled:opacity-50" disabled>Prev</button>
                    <button className="px-2 py-1 border border-surface-300 rounded bg-primary-600 text-white">1</button>
                    <button className="px-2 py-1 border border-surface-300 rounded hover:bg-white disabled:opacity-50" disabled>Next</button>
                </div>
            </div>
        </div>
    );
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
