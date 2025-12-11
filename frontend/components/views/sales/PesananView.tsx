'use client';

import { useState, useCallback } from 'react';
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
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';

export default function PesananView() {
    const [searchInput, setSearchInput] = useState('');
    const searchQuery = useDebounce(searchInput, 500);
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchSalesOrders = useCallback(async (page: number) => {
        const params: any = {
            page,
            limit: 20
        };
        if (searchQuery) params.search = searchQuery;
        if (statusFilter !== 'All') params.status = statusFilter;

        const response = await api.get('/sales-orders', { params });
        return response.data;
    }, [searchQuery, statusFilter]);

    const {
        data: orders,
        loading,
        hasMore,
        lastElementRef,
        reset
    } = useInfiniteScroll({
        fetchData: fetchSalesOrders
    });

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
        reset();
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-4 py-2 border-b border-surface-200 bg-surface-50 flex-none">
                <span className="text-xs font-semibold text-warmgray-500 uppercase tracking-wider">
                    Sales / Sales Orders
                </span>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-200 bg-white overflow-x-auto flex-none">
                <FilterButton label="Date range" value="This Month" />
                <FilterButton label="Customer" value="All" />
                <FilterButton label="Status" value="All" />
                <button className="p-1.5 hover:bg-surface-100 rounded-md text-primary-600">
                    <Filter className="h-4 w-4" />
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/sales/pesanan/new">
                        <button className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm transition-colors">
                            <Plus className="h-5 w-5" />
                        </button>
                    </Link>
                    <button
                        onClick={() => reset()}
                        className="flex items-center justify-center w-8 h-8 bg-white border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded-md shadow-sm transition-colors"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
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
                            value={searchInput}
                            onChange={handleSearchChange}
                            className="w-64 pl-3 pr-10 py-1.5 text-sm bg-white border border-surface-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder:text-warmgray-400"
                        />
                        <div className="absolute right-0 top-0 bottom-0 px-2 flex items-center border-l border-surface-300 bg-surface-50 rounded-r-md">
                            <Search className="h-4 w-4 text-warmgray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto relative">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10 w-full">
                        <tr>
                            <th scope="col" className="px-4 py-2.5 font-semibold w-12 text-center">
                                &nbsp;
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
                        {orders.map((order: any, index: number) => (
                            <tr
                                key={`${order.id}-${index}`}
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
                                    <span className={cn(
                                        "font-semibold text-xs px-2 py-0.5 rounded-full",
                                        order.status === 'CONFIRMED' ? "bg-blue-100 text-blue-700" :
                                            order.status === 'COMPLETED' ? "bg-green-100 text-green-700" :
                                                order.status === 'PROCESSING' ? "bg-indigo-100 text-indigo-700" :
                                                    order.status === 'CANCELLED' ? "bg-red-100 text-red-700" :
                                                        "bg-gray-100 text-gray-700" // Draft
                                    )}>{order.status}</span>
                                </td>
                                <td className="px-4 py-2 text-warmgray-600">{order.salesPerson}</td>
                                <td className="px-4 py-2 text-right font-bold text-warmgray-900">{formatCurrency(order.total)}</td>
                            </tr>
                        ))}

                        {/* Loading Sentinel */}
                        <tr ref={lastElementRef}>
                            <td colSpan={8} className="px-4 py-8 text-center text-warmgray-500">
                                {loading && <div className="flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Loading more orders...</div>}
                                {!hasMore && orders.length > 0 && <span className="text-xs">No more orders</span>}
                                {!loading && orders.length === 0 && "No data available"}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Removed Pagination Footer as handled by Infinite Scroll */}
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
