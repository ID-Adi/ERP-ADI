'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Plus,
    RefreshCw,
    Search,
    Filter,
    MoreHorizontal,
    Trash2,
    FileText,
    ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useTabContext } from '@/contexts/TabContext';
import CustomerForm from '@/components/sales/CustomerForm';

export default function CustomerPage() {
    const {
        openDataTab,
        closeDataTab,
        getActiveDataTab,
        updateDataTabData,
        markDataTabDirty
    } = useTabContext();
    const featureId = '/dashboard/sales/pelanggan';

    // Data State
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Derived state from TabContext
    const activeDataTab = getActiveDataTab();
    const activeTabId = activeDataTab?.id;

    const isListView = !activeTabId || activeTabId === `${featureId}-list`;
    const isFormView = activeTabId && (activeTabId === `${featureId}-new` || activeTabId.startsWith(`${featureId}-edit-`));

    // Extract ID for edit if applicable
    const editId = activeTabId?.startsWith(`${featureId}-edit-`) ? activeTabId.replace(`${featureId}-edit-`, '') : null;
    const editingCustomer = editId ? customers.find(c => c.id === editId) : null;

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (searchQuery) params.search = searchQuery;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await api.get('/customers', params);
            const data = response.data.data || response.data || [];
            if (Array.isArray(data)) {
                setCustomers(data);
            } else {
                setCustomers([]);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        if (isListView) {
            fetchCustomers();
        }
    }, [fetchCustomers, isListView]);

    const handleNewClick = () => {
        openDataTab(featureId, {
            id: `${featureId}-new`,
            title: 'Pelanggan Baru',
            href: featureId
        });
    };

    const handleRowClick = (customer: any) => {
        openDataTab(featureId, {
            id: `${featureId}-edit-${customer.id}`,
            title: `${customer.name}`,
            href: featureId
        });
    };

    const handleCancelForm = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchCustomers();
    };

    const handleSaveSuccess = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchCustomers();
    };

    const handleDeleteSuccess = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchCustomers();
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden">
            {isListView && (
                <ListView
                    customers={customers}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRefresh={fetchCustomers}
                    onNewClick={handleNewClick}
                    onRowClick={handleRowClick}
                />
            )}

            {isFormView && (
                <CustomerForm
                    key={activeTabId}
                    tabId={activeTabId!}
                    featureId={featureId}
                    initialData={editingCustomer}
                    savedData={activeDataTab?.data}
                    updateDataTabData={updateDataTabData}
                    markDataTabDirty={markDataTabDirty}
                    onCancel={handleCancelForm}
                    onSuccess={handleSaveSuccess}
                    onDeleteSuccess={handleDeleteSuccess}
                />
            )}
        </div>
    );
}

interface ListViewProps {
    customers: any[];
    loading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onRefresh: () => void;
    onNewClick: () => void;
    onRowClick: (customer: any) => void;
}

function ListView({
    customers,
    loading,
    searchQuery,
    onSearchChange,
    onRefresh,
    onNewClick,
    onRowClick
}: ListViewProps) {
    const [filters, setFilters] = useState({
        category: 'Semua',
        status: 'Semua'
    });

    return (
        <>
            {/* Filter Bar - Consistent with Inventory Items */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 bg-white flex-none">
                <div className="flex items-center gap-2 overflow-x-auto">
                    <FilterButton
                        label="Status"
                        value={filters.status}
                        onClick={() => {
                            const options = ['Semua', 'Aktif', 'Non Aktif'];
                            const nextIndex = (options.indexOf(filters.status) + 1) % options.length;
                            setFilters({ ...filters, status: options[nextIndex] });
                        }}
                    />
                    <FilterButton
                        label="Kategori"
                        value={filters.category}
                        onClick={() => {
                            const options = ['Semua', 'Umum', 'Retail', 'Grosir', 'Agen'];
                            const nextIndex = (options.indexOf(filters.category) + 1) % options.length;
                            setFilters({ ...filters, category: options[nextIndex] });
                        }}
                    />
                    <button className="flex items-center gap-1 px-2 py-1.5 bg-primary-100 text-primary-700 border border-primary-300 rounded-md text-xs hover:bg-primary-200 transition-colors">
                        <Filter className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Toolbar - Consistent with Inventory Items */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                <div className="flex items-center gap-1">
                    <button
                        onClick={onNewClick}
                        className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                        title="Tambah Pelanggan Baru"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onRefresh}
                        className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded transition-colors bg-white"
                        title="Refresh Data"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Action Buttons Group */}
                    <div className="flex items-center border border-surface-300 rounded bg-white">
                        <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 rounded-l transition-colors" title="Download">
                            <ArrowUpDown className="h-4 w-4" /> {/* Using generic icon as placeholder if Download import missing, but will add imports properly */}
                        </button>
                        <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 transition-colors" title="Cetak">
                            <FileText className="h-4 w-4" />
                        </button>
                        <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 rounded-r transition-colors" title="Pengaturan">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex items-center border border-surface-300 rounded overflow-hidden bg-white">
                        <span className="px-3 py-1.5 text-sm text-warmgray-500 bg-white">Cari...</span>
                        <input
                            type="text"
                            placeholder=""
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-32 px-2 py-1.5 text-sm bg-white border-l border-surface-200 focus:outline-none focus:ring-0 placeholder:text-warmgray-400"
                        />
                    </div>

                    {/* Search Icon */}
                    <button className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-500 rounded bg-white">
                        <Search className="h-4 w-4" />
                    </button>

                    {/* Count */}
                    <span className="text-sm text-warmgray-600 font-medium min-w-[40px] text-right">{customers.length.toLocaleString()}</span>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto relative">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2 font-medium">Nama Pelanggan</th>
                            <th className="px-4 py-2 font-medium">Kode Pelanggan</th>
                            <th className="px-4 py-2 font-medium">Kontak</th>
                            <th className="px-4 py-2 font-medium">Kategori</th>
                            <th className="px-4 py-2 font-medium text-right">Saldo Piutang</th>
                            <th className="px-4 py-2 font-medium text-center">:Non Aktif</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse bg-white">
                                    <td colSpan={6} className="px-4 py-3"><div className="h-4 bg-surface-200 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-warmgray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <FileText className="h-12 w-12 text-warmgray-300 mb-3" />
                                        <p>Tidak ada data pelanggan</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer: any, index: number) => (
                                <tr
                                    key={customer.id}
                                    onClick={() => onRowClick(customer)}
                                    className={cn(
                                        "hover:bg-primary-50 transition-colors cursor-pointer group",
                                        index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                    )}
                                >
                                    <td className="px-4 py-2 font-medium text-warmgray-900">{customer.name}</td>
                                    <td className="px-4 py-2 text-warmgray-600">{customer.code}</td>
                                    <td className="px-4 py-2 text-warmgray-600">
                                        <div className="flex flex-col">
                                            <span>{customer.contactPerson || '-'}</span>
                                            {customer.phone && <span className="text-xs text-warmgray-400">{customer.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-warmgray-600">{customer.category || 'Umum'}</td>
                                    <td className="px-4 py-2 text-right text-warmgray-600">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(customer.receivableBalance || 0)}
                                    </td>
                                    <td className="px-4 py-2 text-center text-warmgray-600">
                                        {customer.isActive ? '' : 'Ya'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function FilterButton({ label, value, onClick }: { label: string, value: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs hover:bg-surface-200 transition-colors whitespace-nowrap"
        >
            <span className="text-warmgray-500">{label}:</span>
            <span className="font-semibold text-warmgray-700">{value}</span>
            <ArrowUpDown className="h-3 w-3 text-warmgray-400" />
        </button>
    );
}
