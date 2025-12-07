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
    ArrowUpDown,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Dummy data
const dummyOrders = [
    {
        id: '1',
        orderNumber: 'SO.2024.12.00482',
        customerName: 'APLIKATOR (PKY)',
        description: 'PAK RONI',
        orderDate: '2024-11-11',
        salesPerson: 'SC - Santi',
        total: 1506500,
        status: 'Terproses',
    },
    {
        id: '2',
        orderNumber: 'SO.2024.12.00487',
        customerName: 'CV. ZULFA BERKAH BERSAMA',
        description: 'PAK IKROM',
        orderDate: '2024-11-07',
        salesPerson: 'SC - Santi',
        total: 2606000,
        status: 'Terproses',
    },
    {
        id: '3',
        orderNumber: 'SO.2024.12.00486',
        customerName: 'TB. KARYA JASA',
        description: 'TB. KARYA JASA',
        orderDate: '2024-11-07',
        salesPerson: 'SR - Rina',
        total: 2883000,
        status: 'Terproses',
    },
];

export default function SalesOrdersPage() {
    const [orders] = useState(dummyOrders);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOrders = orders.filter((order) =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-4 py-2 border-b border-surface-200 bg-surface-50">
                <span className="text-xs font-semibold text-warmgray-500 uppercase tracking-wider">
                    Sales / Sales Orders
                </span>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-200 bg-white overflow-x-auto">
                <FilterButton label="Date range" value="This Month" />
                <FilterButton label="Customer" value="All" />
                <FilterButton label="Status" value="All" />
                <button className="p-1.5 hover:bg-surface-100 rounded-md text-primary-600">
                    <Filter className="h-4 w-4" />
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/sales/orders/new">
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
                        {filteredOrders.length}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-4 py-2.5 font-semibold w-12 text-center">
                                <ArrowUpDown className="h-3 w-3 inline opacity-50" />
                            </th>
                            <Th>Order #</Th>
                            <Th>Date</Th>
                            <Th>Customer</Th>
                            <Th>Description</Th>
                            <Th>Status</Th>
                            <Th>Sales Person</Th>
                            <Th className="text-right">Total</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200">
                        {filteredOrders.map((order, index) => (
                            <tr
                                key={order.id}
                                className={cn(
                                    "hover:bg-primary-50 transition-colors cursor-pointer group",
                                    index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                )}
                            >
                                <td className="px-4 py-2 text-center text-warmgray-400">
                                    <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-primary-500" />
                                </td>
                                <td className="px-4 py-2 font-medium text-warmgray-900">{order.orderNumber}</td>
                                <td className="px-4 py-2 text-warmgray-600 whitespace-nowrap">{formatDate(order.orderDate)}</td>
                                <td className="px-4 py-2 text-warmgray-900 font-medium">{order.customerName}</td>
                                <td className="px-4 py-2 text-warmgray-600 truncate max-w-[200px]">{order.description}</td>
                                <td className="px-4 py-2">
                                    <span className="font-semibold text-warmgray-700">{order.status}</span>
                                </td>
                                <td className="px-4 py-2 text-warmgray-600">{order.salesPerson}</td>
                                <td className="px-4 py-2 text-right font-bold text-warmgray-900">{formatCurrency(order.total)}</td>
                            </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-warmgray-500">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-surface-200 bg-surface-50 flex items-center justify-between text-xs text-warmgray-500">
                <span>Showing 1 to {filteredOrders.length} of {filteredOrders.length} items</span>
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
                <ArrowUpDown className="h-3 w-3 opacity-30" />
            </div>
        </th>
    )
}
