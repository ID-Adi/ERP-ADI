'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    RefreshCw,
    Printer,
    Download,
    ChevronDown,
    Filter,
    X,
    Settings,
    FileDown,
    Check,
    Calendar,
    Package,
    Save,
    Paperclip,
    Trash,
    FileText
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import { Button } from '@/components/ui';
import api from '@/lib/api';
import InfiniteScroll from 'react-infinite-scroll-component';
import { createPortal } from 'react-dom';
import SearchableSelect from '@/components/ui/SearchableSelect';

export default function ReceiptsPage() {
    const router = useRouter();
    const {
        openDataTab,
        closeDataTab,
        getActiveDataTab,
        updateDataTabData
    } = useTabContext();
    const featureId = '/dashboard/sales/penerimaan';

    // --- Tab State Logic ---
    const activeDataTab = getActiveDataTab();
    const activeTabId = activeDataTab?.id;
    const isListView = !activeTabId || activeTabId === `${featureId}-list`;
    const isFormView = activeTabId && (activeTabId === `${featureId}-new` || activeTabId.startsWith(`${featureId}-edit-`));
    const editId = activeTabId?.startsWith(`${featureId}-edit-`) ? activeTabId.replace(`${featureId}-edit-`, '') : null;
    const isNew = activeTabId === `${featureId}-new`;

    // --- Data Fetching State ---
    const [searchQuery, setSearchQuery] = useState('');
    // Unified filters state for consistency with Inventory Items pattern
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        customerId: ''
    });

    const [items, setItems] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    // Helper to deduplicate items
    const addUniqueItems = (existing: any[], incoming: any[]) => {
        const existingIds = new Set(existing.map(i => i.id));
        const uniqueIncoming = incoming.filter(i => !existingIds.has(i.id));
        return [...existing, ...uniqueIncoming];
    };

    // Initial Fetch & Refresh
    const fetchFirstPage = useCallback(async () => {
        setLoading(true);
        setPage(1);
        setHasMore(false); // Reset hasMore initially
        try {
            const params: any = {
                page: 1,
                limit: 50
            };
            if (searchQuery) params.search = searchQuery;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.customerId) params.customerId = filters.customerId;

            const res = await api.get('/sales-receipts', { params });
            const newData = res.data.data || [];
            const meta = res.data.meta || {};

            const mapped = newData.map((r: any) => transformReceiptData(r));
            setItems(mapped);
            setTotal(meta.total || mapped.length);

            // Only set hasMore if we got a full page AND total indicates more data
            const totalCount = meta.total || 0;
            if (totalCount > 0 && mapped.length >= 50 && mapped.length < totalCount) {
                setHasMore(true);
            } else {
                setHasMore(false);
            }

        } catch (err) {
            console.error("Failed to fetch receipts", err);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (loading) return;
        const nextPage = page + 1;
        try {
            const params: any = {
                page: nextPage,
                limit: 50
            };
            if (searchQuery) params.search = searchQuery;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.customerId) params.customerId = filters.customerId;

            const res = await api.get('/sales-receipts', { params });
            const newData = res.data.data || [];
            const meta = res.data.meta || {};

            const mapped = newData.map((r: any) => transformReceiptData(r));
            setItems(prev => addUniqueItems(prev, mapped));
            setPage(nextPage);

            if (mapped.length === 0 || items.length + mapped.length >= (meta.total || total)) {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to fetch more receipts", err);
            setHasMore(false);
        }
    }, [page, searchQuery, filters, items.length, total, loading]);

    // Initial load
    useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);



    const handleRefresh = () => {
        fetchFirstPage();
    };

    const handleRowClick = (item: any) => {
        openDataTab(featureId, {
            id: `${featureId}-edit-${item.id}`,
            title: item.receiptNumber,
            href: featureId
        });
    };

    const handleNewClick = () => {
        openDataTab(featureId, {
            id: `${featureId}-new`,
            title: 'Data Baru',
            href: featureId
        });
    };

    const handleCloseForm = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        handleRefresh();
    };

    // --- Form View Handling ---
    const [editData, setEditData] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Initial Data Resolution
    const cachedData = (activeDataTab?.data && Object.keys(activeDataTab.data).length > 0)
        ? activeDataTab.data
        : null;

    useEffect(() => {
        if (isFormView && editId && !cachedData) {
            const loadItem = async () => {
                setFormLoading(true);
                try {
                    const foundInList = items.find(i => i.id === editId);
                    if (foundInList && foundInList.raw) {
                        setEditData(foundInList.raw);
                    } else {
                        const res = await api.get(`/sales-receipts/${editId}`);
                        setEditData(res.data);
                    }
                } catch (e) {
                    console.error(e);
                    const found = items.find(i => i.id === editId);
                    if (found) setEditData(found.raw);
                } finally {
                    setFormLoading(false);
                }
            };
            loadItem();
        } else if (isNew) {
            setEditData(null);
        }
    }, [isFormView, editId, isNew, items, cachedData]);

    let formDataToRender = null;
    let isDataReady = false;

    if (cachedData) {
        formDataToRender = cachedData;
        isDataReady = true;
    } else if (isNew) {
        formDataToRender = null;
        isDataReady = true;
    } else if (editId && editData) {
        formDataToRender = editData;
        isDataReady = true;
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden relative">

            {/* FORM VIEW OVERLAY */}
            <div className={cn(
                "absolute inset-0 z-20 bg-white flex flex-col transition-opacity duration-200",
                isFormView ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none hidden"
            )}>
                {isFormView && (
                    <>
                        {(!isDataReady || formLoading) ? (
                            <div className="flex h-full items-center justify-center gap-2 text-warmgray-500">
                                <RefreshCw className="animate-spin h-6 w-6 text-primary-600" />
                                <span>Memuat data...</span>
                            </div>
                        ) : (
                            <ReceiptForm
                                key={activeTabId || 'form'}
                                initialData={formDataToRender}
                                onCancel={handleCloseForm}
                                onSuccess={handleCloseForm}
                            />
                        )}
                    </>
                )}
            </div>

            {/* LIST VIEW CONTENT */}
            <div className={cn("contents")}>
                <ListView
                    items={items}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    loading={loading}
                    onRowClick={handleRowClick}
                    onNewClick={handleNewClick}
                    filters={filters}
                    onFilterChange={setFilters}
                    total={total}
                    hasMore={hasMore}
                    fetchMore={fetchNextPage}
                    onRefresh={handleRefresh}
                />
            </div>
        </div>
    );
}

// ============================================================================
// LIST VIEW
// ============================================================================
interface ListViewProps {
    items: any[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading: boolean;
    onRowClick: (item: any) => void;
    onNewClick: () => void;
    filters: {
        startDate: string;
        endDate: string;
        customerId: string;
    };
    onFilterChange: (filters: any) => void;
    total: number;
    hasMore: boolean;
    fetchMore: () => void;
    onRefresh: () => void;
}

function ListView({
    items,
    searchQuery,
    onSearchChange,
    loading,
    onRowClick,
    onNewClick,
    filters,
    onFilterChange,
    total,
    hasMore,
    fetchMore,
    onRefresh
}: ListViewProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Filter Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 bg-white flex-none">
                {/* Left: Filters */}
                <div className="flex items-center gap-2 overflow-x-auto">
                    <DateFilterDropdown
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onChange={(start, end) => onFilterChange({ ...filters, startDate: start, endDate: end })}
                    />
                    <CustomerFilterDropdown
                        selectedId={filters.customerId}
                        onChange={(id) => onFilterChange({ ...filters, customerId: id })}
                    />
                    <button className="flex items-center gap-1 px-2 py-1.5 bg-primary-100 text-primary-700 border border-primary-300 rounded-md text-xs hover:bg-primary-200 transition-colors">
                        <Filter className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                {/* Left: Add & Refresh */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onNewClick}
                        className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onRefresh}
                        className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded transition-colors bg-white"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>

                {/* Right: Actions & Search */}
                <div className="flex items-center gap-2">
                    {/* Action Buttons Group */}
                    <div className="flex items-center border border-surface-300 rounded bg-white">
                        <Tooltip text="Import">
                            <button
                                className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 rounded-l transition-colors"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Export">
                            <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 transition-colors">
                                <FileDown className="h-4 w-4" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Cetak">
                            <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 transition-colors">
                                <Printer className="h-4 w-4" />
                            </button>
                        </Tooltip>
                        <Tooltip text="Pengaturan">
                            <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 rounded-r transition-colors">
                                <Settings className="h-4 w-4" />
                            </button>
                        </Tooltip>
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

                    {/* Total Count Display */}
                    <div className="flex items-center justify-center h-8 px-3 border border-surface-300 bg-surface-50 text-warmgray-600 rounded text-xs font-medium whitespace-nowrap">
                        {total > 0 ? total.toLocaleString() : (items.length > 0 ? items.length.toLocaleString() : '0')} Data
                    </div>
                </div>
            </div>

            {/* Table */}
            <div id="scrollableDiv" className="flex-1 overflow-auto relative">
                <InfiniteScroll
                    dataLength={items.length}
                    next={fetchMore}
                    hasMore={hasMore}
                    loader={
                        <div className="flex justify-center p-4">
                            <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    }
                    scrollableTarget="scrollableDiv"
                    className="!overflow-visible"
                >
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                            <tr>
                                <Th>No. Kwitansi</Th>
                                <Th>Tanggal</Th>
                                <Th>Pelanggan</Th>
                                <Th>No. Faktur</Th>
                                <Th>Metode</Th>
                                <Th align="right">Nilai</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200">
                            {items.map((item, index) => {
                                return (
                                    <tr
                                        key={`${item.id}-${index}`}
                                        className={cn(
                                            "hover:bg-primary-50 transition-colors cursor-pointer group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                        )}
                                        onClick={() => onRowClick(item)}
                                    >
                                        <td className="px-4 py-2 font-medium text-warmgray-900">{item.receiptNumber}</td>
                                        <td className="px-4 py-2 text-warmgray-600 whitespace-nowrap">{formatDate(item.receiptDate)}</td>
                                        <td className="px-4 py-2 text-warmgray-900 font-medium">{item.customerName}</td>
                                        <td className="px-4 py-2 text-warmgray-600 font-mono text-xs">{item.invoiceNumber}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{item.paymentMethod || '-'}</td>
                                        <td className="px-4 py-2 text-right font-bold text-warmgray-900">{formatCurrency(item.amount)}</td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-warmgray-500">
                                        <Package className="h-12 w-12 mx-auto mb-3 text-warmgray-300" />
                                        <p>Tidak ada data penerimaan</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </InfiniteScroll>
            </div>
        </div>
    );
}

// ============================================================================
// FORM VIEW
// ============================================================================
function ReceiptForm({ initialData, onCancel, onSuccess }: { initialData?: any, onCancel: () => void, onSuccess: () => void }) {
    const isEdit = !!initialData;
    const [bankOptions, setBankOptions] = useState<any[]>([]);
    const [customerOptions, setCustomerOptions] = useState<any[]>([]);
    const [invoiceOptions, setInvoiceOptions] = useState<any[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
    const [editingItem, setEditingItem] = useState<any>(null); // For Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        customerId: initialData?.customerId || '',
        customerName: initialData?.customer?.name || '',
        bankId: initialData?.bankAccountId || '',
        bankName: initialData?.bankAccount?.name || '',
        receiptNumber: initialData?.receiptNumber || '',
        receiptDate: initialData?.receiptDate ? new Date(initialData.receiptDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: initialData ? Number(initialData.amount) : 0,
        notes: initialData?.notes || '',
    });

    useEffect(() => {
        if (initialData && initialData.lines) {
            const lines = initialData.lines.map((line: any) => ({
                id: line.fakturId,
                fakturNumber: line.faktur?.fakturNumber,
                fakturDate: line.faktur?.fakturDate ? new Date(line.faktur.fakturDate).toISOString().split('T')[0] : '-',
                total: Number(line.faktur?.totalAmount || 0),
                amountPaid: Number(line.faktur?.amountPaid) - Number(line.amount),
                thisPayment: Number(line.amount)
            }));
            setSelectedInvoices(lines);
        }
    }, [initialData]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [banksRes, customersRes] = await Promise.all([
                    api.get('/accounts'),
                    api.get('/customers')
                ]);

                if (banksRes.data && banksRes.data.data) {
                    const banks = banksRes.data.data
                        .filter((acc: any) => acc.type === 'CASH_AND_BANK' && !acc.isHeader)
                        .map((acc: any) => ({
                            value: acc.id,
                            label: acc.name,
                            description: acc.code
                        }));
                    setBankOptions(banks);
                }

                if (customersRes.data && customersRes.data.data) {
                    const customers = customersRes.data.data.map((cust: any) => ({
                        value: cust.id,
                        label: cust.name,
                        description: cust.code
                    }));
                    setCustomerOptions(customers);
                }

            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!formData.customerId) {
            setInvoiceOptions([]);
            return;
        }

        const fetchInvoices = async () => {
            try {
                const res = await api.get('/fakturs', {
                    params: {
                        customerId: formData.customerId,
                        status: 'UNPAID,PARTIAL,OVERDUE'
                    }
                });
                if (res.data && res.data.data) {
                    const options = res.data.data.map((inv: any) => ({
                        value: inv.id,
                        label: `${inv.fakturNumber} - ${formatCurrency(inv.totalAmount - (inv.amountPaid || 0))}`,
                        originalData: {
                            id: inv.id,
                            fakturNumber: inv.fakturNumber,
                            fakturDate: new Date(inv.fakturDate).toISOString().split('T')[0],
                            total: Number(inv.totalAmount),
                            amountPaid: Number(inv.amountPaid || 0),
                        }
                    }));
                    setInvoiceOptions(options);
                }
            } catch (err) {
                console.error("Failed to fetch invoices", err);
            }
        };

        fetchInvoices();
    }, [formData.customerId]);

    const handleSave = async () => {
        if (!formData.customerId || !formData.bankId || selectedInvoices.length === 0) {
            alert("Harap lengkapi data (Customer, Bank, dan Faktur)");
            return;
        }

        const lines = selectedInvoices.map((inv: any) => ({
            fakturId: inv.id,
            amount: inv.thisPayment || (inv.total - (inv.amountPaid || 0))
        }));

        const totalAmount = lines.reduce((sum, l) => sum + Number(l.amount), 0);

        const finalPayload = {
            receiptDate: formData.receiptDate,
            customerId: formData.customerId,
            bankAccountId: formData.bankId,
            amount: totalAmount,
            notes: formData.notes,
            lines
        };

        try {
            if (isEdit && initialData?.id) {
                await api.put(`/sales-receipts/${initialData.id}`, finalPayload);
            } else {
                await api.post('/sales-receipts', finalPayload);
            }
            onSuccess();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menyimpan");
        }
    };

    const handlePayAll = () => {
        const total = selectedInvoices.reduce((sum, inv) => {
            const remaining = inv.total - (inv.amountPaid || 0);
            return sum + remaining;
        }, 0);
        setFormData(prev => ({ ...prev, amount: total }));
        // Also update 'thisPayment' for all lines to match if we are mapping logic
        setSelectedInvoices(prev => prev.map(inv => ({
            ...inv,
            thisPayment: inv.total - (inv.amountPaid || 0)
        })));
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

        try {
            await api.delete(`/sales-receipts/${initialData.id}`);
            onSuccess();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menghapus");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-warmgray-200 flex-none shadow-sm z-30">
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#d95d39]" />
                    <span className="font-bold text-lg text-[#d95d39]">
                        {isEdit ? formData.receiptNumber : 'Penerimaan Penjualan Baru'}
                    </span>

                </div>
                <div className="flex items-center gap-2">
                    {/* ACTION BUTTONS */}
                    <button onClick={onCancel} className="text-warmgray-600 hover:text-warmgray-900 font-medium text-sm transition-colors mr-2">
                        Batalkan
                    </button>
                    {isEdit && (
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300 font-semibold h-9"
                            onClick={handleDelete}
                        >
                            <Trash className="h-4 w-4 mr-2" />
                            Hapus
                        </Button>
                    )}

                    <Button
                        onClick={handleSave}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold h-9 shadow-sm"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Simpan
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Form Section */}
                <div className="bg-white border-b border-warmgray-200 px-6 py-4 flex-shrink-0 relative z-20">
                    <div className="flex flex-wrap gap-6 items-start">
                        {/* Customer */}
                        <div className="w-full max-w-[350px]">
                            <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">Terima Dari <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <SearchableSelect
                                    options={customerOptions}
                                    value={formData.customerId}
                                    onChange={(val) => {
                                        const selected = customerOptions.find(opt => opt.value === val);
                                        setFormData({
                                            ...formData,
                                            customerId: val,
                                            customerName: selected ? selected.label : ''
                                        });
                                    }}
                                    placeholder="Cari Pelanggan..."
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Bank */}
                        <div className="w-full max-w-[300px]">
                            <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">Setor Ke (Kas/Bank) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <SearchableSelect
                                    options={bankOptions}
                                    value={formData.bankId}
                                    onChange={(val) => {
                                        const selected = bankOptions.find(opt => opt.value === val);
                                        setFormData({
                                            ...formData,
                                            bankId: val,
                                            bankName: selected ? selected.label : ''
                                        });
                                    }}
                                    placeholder="Pilih Akun..."
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="w-full max-w-[150px]">
                            <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">Tanggal Transaksi</label>
                            <input
                                type="date"
                                className="w-full px-3 py-1.5 text-sm border border-warmgray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 h-[38px] bg-white font-medium text-warmgray-900"
                                value={formData.receiptDate}
                                onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                            />
                        </div>

                    </div>
                </div>

                {/* Middle Section - Toolbar & Table */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden p-6 relative bg-[#f0f2f5]">
                    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-warmgray-200 overflow-hidden relative">

                        {/* Search / Toolbar */}
                        <div className="p-2 border-b border-warmgray-200 flex items-center gap-2 bg-warmgray-50/50">
                            <div className={cn("relative flex-1 max-w-xl", !formData.customerId && "cursor-not-allowed opacity-60")}>
                                <SearchableSelect
                                    options={invoiceOptions}
                                    value=""
                                    onChange={(val) => {
                                        if (!formData.customerId) {
                                            alert("Pilih Pelanggan Terlebih Dahulu");
                                            return;
                                        }
                                        if (!val) return;
                                        const selected = invoiceOptions.find(opt => opt.value === val);
                                        if (selected && selected.originalData) {
                                            if (selectedInvoices.find((inv: any) => inv.id === selected.value)) {
                                                return;
                                            }
                                            setSelectedInvoices([...selectedInvoices, selected.originalData]);
                                        }
                                    }}
                                    placeholder={formData.customerId ? "Cari No. Faktur untuk ditambah..." : "Pilih Pelanggan Dulu..."}
                                    className="w-full"
                                    disabled={!formData.customerId}
                                />
                            </div>
                            <div className="px-3 py-1.5 bg-white border border-warmgray-300 rounded text-sm font-medium text-warmgray-700 shadow-sm flex items-center gap-2 ml-auto">
                                <span>{selectedInvoices.length} Item</span>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-auto bg-white relative">
                            <table className="w-full text-xs z-10 relative">
                                <thead className="bg-warmgray-50 sticky top-0 z-20 border-b border-warmgray-200">
                                    <tr>
                                        <th className="py-2 px-2 w-[30px] text-center font-semibold text-warmgray-600 border-r border-warmgray-200">No</th>
                                        <th className="py-2 px-4 text-left font-semibold text-warmgray-600 border-r border-warmgray-200">No. Faktur</th>
                                        <th className="py-2 px-4 text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Tgl Faktur</th>
                                        <th className="py-2 px-4 w-[150px] text-right font-semibold text-warmgray-600 border-r border-warmgray-200">Total Faktur</th>
                                        <th className="py-2 px-4 w-[150px] text-right font-semibold text-warmgray-600 border-r border-warmgray-200">Sisa Tagihan</th>
                                        <th className="py-2 px-4 w-[150px] text-right font-semibold text-warmgray-600">Pembayaran</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-warmgray-100">
                                    {selectedInvoices.length > 0 ? (
                                        selectedInvoices.map((inv, index) => (
                                            <tr
                                                key={inv.id}
                                                className="odd:bg-white even:bg-[#fafafb] hover:bg-primary-50 transition-colors group cursor-pointer"
                                                onClick={() => {
                                                    setEditingItem({ ...inv, index });
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                <td className="py-1.5 px-2 text-center text-warmgray-400 border-r border-warmgray-100">{index + 1}</td>
                                                <td className="py-1.5 px-4 font-medium text-warmgray-900 border-r border-warmgray-100">{inv.fakturNumber}</td>
                                                <td className="py-1.5 px-4 text-warmgray-600 border-r border-warmgray-100">{inv.fakturDate}</td>
                                                <td className="py-1.5 px-4 text-right text-warmgray-900 border-r border-warmgray-100 font-medium">{formatCurrency(inv.total).replace('Rp', '')}</td>
                                                <td className="py-1.5 px-4 text-right text-warmgray-900 border-r border-warmgray-100 font-medium">{formatCurrency(inv.total - (inv.amountPaid || 0)).replace('Rp', '')}</td>
                                                <td className="py-1.5 px-4 text-right text-warmgray-900 font-bold text-primary-700 bg-primary-50/10">
                                                    {formatCurrency(inv.thisPayment || (inv.total - (inv.amountPaid || 0))).replace('Rp', '')}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-warmgray-400 italic">
                                                Belum ada faktur yang dipilih. Gunakan pencarian di atas untuk menambahkan faktur.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Bottom Total Section */}
                <div className="bg-white border-t border-warmgray-300 px-6 py-3 flex items-center justify-end shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20 flex-none">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-4">
                            <div className="flex items-center gap-2 text-sm text-warmgray-600">
                                Total Pembayaran
                                <button
                                    onClick={handlePayAll}
                                    title="Bayar Sesuai Total Tagihan"
                                    className="p-1 hover:bg-primary-50 text-primary-600 rounded"
                                >
                                    <Package className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="px-5 py-2 bg-warmgray-50 border border-warmgray-200 rounded min-w-[200px] text-right">
                            <span className="text-xl font-bold text-primary-600">{formatCurrency(formData.amount)}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal */}
            <ReceiptItemModal
                isOpen={isModalOpen}
                item={editingItem}
                onClose={() => setIsModalOpen(false)}
                onSave={(newAmount) => {
                    const newInvoices = [...selectedInvoices];
                    if (editingItem && editingItem.index !== undefined && newInvoices[editingItem.index]) {
                        newInvoices[editingItem.index] = { ...newInvoices[editingItem.index], thisPayment: newAmount };
                        setSelectedInvoices(newInvoices);
                    }
                    setIsModalOpen(false);
                }}
                onDelete={() => {
                    const newInvoices = [...selectedInvoices];
                    if (editingItem && editingItem.index !== undefined) {
                        newInvoices.splice(editingItem.index, 1);
                        setSelectedInvoices(newInvoices);
                    }
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}

function ReceiptItemModal({
    isOpen,
    onClose,
    item,
    onSave,
    onDelete
}: {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onSave: (amount: number) => void;
    onDelete: () => void;
}) {
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        if (isOpen && item) {
            setAmount(item.thisPayment || (item.total - (item.amountPaid || 0)));
        }
    }, [isOpen, item]);

    if (!isOpen || !item) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-4 py-3 border-b border-warmgray-200 flex items-center justify-between bg-warmgray-50">
                    <h3 className="font-bold text-md text-warmgray-800">Rincian Faktur</h3>
                    <button onClick={onClose} className="p-1 hover:bg-warmgray-200 rounded text-warmgray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-warmgray-100 pb-2">
                            <span className="text-warmgray-500">No. Faktur</span>
                            <span className="font-medium text-warmgray-900">{item.fakturNumber}</span>
                        </div>
                        <div className="flex justify-between border-b border-warmgray-100 pb-2">
                            <span className="text-warmgray-500">Total Faktur</span>
                            <span className="font-medium text-warmgray-900">{formatCurrency(item.total)}</span>
                        </div>
                        <div className="flex justify-between border-b border-warmgray-100 pb-2">
                            <span className="text-warmgray-500">Sisa Tagihan</span>
                            <span className="font-medium text-warmgray-900">{formatCurrency(item.total - (item.amountPaid || 0))}</span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-bold text-warmgray-700 mb-2">Nilai Pembayaran</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray-400 font-medium">Rp</span>
                            <input
                                type="number"
                                className="w-full pl-9 pr-3 py-2 border border-warmgray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-bold text-right text-lg"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
                <div className="px-4 py-3 border-t border-warmgray-200 bg-warmgray-50 flex justify-between items-center">
                    <button
                        onClick={() => {
                            if (confirm('Hapus item ini dari daftar pembayaran?')) onDelete();
                        }}
                        className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded hover:border-red-300 transition-colors flex items-center gap-1"
                    >
                        <Trash className="h-3.5 w-3.5" />
                        Hapus
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-3 py-1.5 text-sm font-semibold text-warmgray-600 hover:bg-warmgray-200 rounded transition-colors">Batal</button>
                        <button
                            onClick={() => onSave(amount)}
                            className="px-4 py-1.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm transition-colors"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}


// ============================================================================
// LOGIC HELPERS
// ============================================================================

const transformReceiptData = (r: any) => {
    return {
        id: r.id,
        receiptNumber: r.receiptNumber,
        invoiceNumber: r.lines?.length > 1
            ? `${r.lines[0].faktur?.fakturNumber} (+${r.lines.length - 1})`
            : r.lines?.[0]?.faktur?.fakturNumber || '-',
        customerName: r.customer?.name || '-',
        receiptDate: r.receiptDate,
        paymentMethod: r.paymentMethod,
        amount: Number(r.amount),
        status: r.status,
        raw: r
    };
};

function getStatusBadge(status: string) {
    switch (status) {
        case 'DRAFT': return { label: 'Draf', className: 'bg-gray-100 text-gray-700' };
        case 'POSTED': return { label: 'Terposting', className: 'bg-green-100 text-green-700' };
        case 'CANCELLED': return { label: 'Dibatalkan', className: 'bg-red-100 text-red-700' };
        default: return { label: status, className: 'bg-gray-100 text-gray-700' };
    }
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function Th({ children, className, align = 'left' }: { children?: React.ReactNode, className?: string, align?: 'left' | 'right' | 'center' }) {
    return (
        <th scope="col" className={cn("px-4 py-2.5 font-semibold whitespace-nowrap cursor-pointer hover:bg-warmgray-700 transition-colors", className)}>
            <div className={cn("flex items-center gap-1",
                align === 'right' && "justify-end",
                align === 'center' && "justify-center"
            )}>
                {children}
            </div>
        </th>
    );
}

function Tooltip({ text, children }: { text: string, children: React.ReactNode }) {
    return (
        <div className="relative group">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-warmgray-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-warmgray-800" />
            </div>
        </div>
    );
}

function StatusFilterDropdown({ selected, onChange }: { selected: string[], onChange: (val: string[]) => void }) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState<{ top: number, left: number } | null>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const dropdown = document.getElementById('status-filter-dropdown');
            if (
                buttonRef.current &&
                !buttonRef.current.contains(target) &&
                dropdown &&
                !dropdown.contains(target)
            ) {
                setOpen(false);
            }
        };

        const updatePosition = () => {
            if (open && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX
                });
            }
        };

        if (open) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open]);

    const handleToggle = () => {
        if (!open) setPosition(null);
        setOpen(!open);
    };

    const options = [
        { value: 'POSTED', label: 'Terposting' },
        { value: 'DRAFT', label: 'Draf' },
        { value: 'CANCELLED', label: 'Dibatalkan' },
    ];

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(s => s !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const labelValue = selected.length === 0 ? 'Semua' :
        selected.length === 1 ? options.find(o => o.value === selected[0])?.label :
            `${selected.length} Selected`;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs hover:bg-surface-200 transition-colors whitespace-nowrap"
            >
                <span className="text-warmgray-500">Status:</span>
                <span className="font-semibold text-warmgray-700">{labelValue}</span>
                <ChevronDown className="h-3 w-3 text-warmgray-400" />
            </button>

            {open && position && typeof document !== 'undefined' && createPortal(
                <div
                    id="status-filter-dropdown"
                    className="fixed bg-white border border-surface-200 rounded-lg shadow-lg z-[9999] py-1 w-48 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        top: position.top - window.scrollY,
                        left: position.left
                    }}
                >
                    {options.map(option => (
                        <div
                            key={option.value}
                            className="flex items-center px-3 py-2 hover:bg-surface-50 cursor-pointer"
                            onClick={() => toggleOption(option.value)}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded border border-surface-300 mr-3 flex items-center justify-center transition-colors",
                                selected.includes(option.value) ? "bg-primary-600 border-primary-600" : "bg-white"
                            )}>
                                {selected.includes(option.value) && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-sm text-warmgray-700">{option.label}</span>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}

function CustomerFilterDropdown({
    selectedId,
    onChange
}: {
    selectedId: string,
    onChange: (id: string) => void
}) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState<{ top: number, left: number } | null>(null);

    const [customers, setCustomers] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (open && customers.length === 0) {
            setLoading(true);
            api.get('/customers', { params: { limit: 100 } })
                .then(res => {
                    setCustomers(res.data.data || []);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [open, customers.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const dropdown = document.getElementById('customer-filter-dropdown');
            if (
                buttonRef.current &&
                !buttonRef.current.contains(target) &&
                dropdown &&
                !dropdown.contains(target)
            ) {
                setOpen(false);
            }
        };
        const updatePosition = () => {
            if (open && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX
                });
            }
        };
        if (open) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open]);

    const toggleOption = (id: string) => {
        onChange(id === selectedId ? '' : id);
        setOpen(false);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedName = customers.find(c => c.id === selectedId)?.name || 'Semua';

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs hover:bg-surface-200 transition-colors whitespace-nowrap"
            >
                <span className="text-warmgray-500">Pelanggan:</span>
                <span className="font-semibold text-warmgray-700 max-w-[100px] truncate">{selectedId ? selectedName : 'Semua'}</span>
                <ChevronDown className="h-3 w-3 text-warmgray-400" />
            </button>

            {open && position && typeof document !== 'undefined' && createPortal(
                <div
                    id="customer-filter-dropdown"
                    className="fixed bg-white border border-surface-200 rounded-lg shadow-lg z-[9999] w-64 overflow-hidden flex flex-col max-h-80 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        top: position.top - window.scrollY,
                        left: position.left
                    }}
                >
                    <div className="p-2 border-b border-surface-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari/Pilih..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-warmgray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-warmgray-400" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-xs text-warmgray-500">Loading...</div>
                        ) : (
                            <ul>
                                <li
                                    className={cn(
                                        "px-4 py-2 text-sm text-warmgray-900 cursor-pointer hover:bg-surface-50 border-b border-surface-50 last:border-0",
                                        !selectedId && "bg-primary-50 text-primary-700 font-medium"
                                    )}
                                    onClick={() => toggleOption('')}
                                >
                                    Semua Pelanggan
                                </li>
                                {filteredCustomers.map(customer => (
                                    <li
                                        key={customer.id}
                                        className={cn(
                                            "px-4 py-2 text-sm text-warmgray-900 cursor-pointer hover:bg-surface-50 border-b border-surface-50 last:border-0",
                                            selectedId === customer.id && "bg-primary-50 text-primary-700 font-medium"
                                        )}
                                        onClick={() => toggleOption(customer.id)}
                                    >
                                        {customer.name}
                                    </li>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <div className="p-4 text-center text-xs text-warmgray-400">Tidak ditemukan</div>
                                )}
                            </ul>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function DateFilterDropdown({
    startDate,
    endDate,
    onChange
}: {
    startDate: string,
    endDate: string,
    onChange: (start: string, end: string) => void
}) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState<{ top: number, left: number } | null>(null);
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const dropdown = document.getElementById('date-filter-dropdown');
            if (
                buttonRef.current &&
                !buttonRef.current.contains(target) &&
                dropdown &&
                !dropdown.contains(target)
            ) {
                setOpen(false);
            }
        };
        const updatePosition = () => {
            if (open && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX
                });
            }
        };
        if (open) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open]);

    const handleApply = () => {
        onChange(localStartDate, localEndDate);
        setOpen(false);
    };

    const handleReset = () => {
        setLocalStartDate('');
        setLocalEndDate('');
        onChange('', '');
        setOpen(false);
    };

    const labelValue = startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` :
        startDate ? `From ${formatDate(startDate)}` :
            'All Dates';

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs hover:bg-surface-200 transition-colors whitespace-nowrap"
            >
                <Calendar className="h-3 w-3 text-warmgray-400" />
                <span className="text-warmgray-500">Tanggal:</span>
                <span className="font-semibold text-warmgray-700">{labelValue}</span>
                <ChevronDown className="h-3 w-3 text-warmgray-400" />
            </button>

            {open && position && typeof document !== 'undefined' && createPortal(
                <div
                    id="date-filter-dropdown"
                    className="fixed bg-white border border-surface-200 rounded-lg shadow-lg z-[9999] p-4 w-72 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        top: position.top - window.scrollY,
                        left: position.left
                    }}
                >
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-warmgray-500 mb-1">Dari Tanggal</label>
                            <input
                                type="date"
                                value={localStartDate}
                                onChange={(e) => setLocalStartDate(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-warmgray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-warmgray-500 mb-1">Sampai Tanggal</label>
                            <input
                                type="date"
                                value={localEndDate}
                                onChange={(e) => setLocalEndDate(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-warmgray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                            <button
                                onClick={handleReset}
                                className="text-xs text-warmgray-500 hover:text-warmgray-800"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-3 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
