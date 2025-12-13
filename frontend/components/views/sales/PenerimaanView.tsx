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
import { confirmAction, showSuccess, showError } from '@/lib/swal';
import InfiniteScroll from 'react-infinite-scroll-component';
import { createPortal } from 'react-dom';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { useDebounce } from '@/hooks/useDebounce';
import ReceiptForm from '@/components/business/ReceiptForm';

export default function PenerimaanView() {
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
    const [searchInput, setSearchInput] = useState('');
    const searchQuery = useDebounce(searchInput, 500);
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
                    searchInput={searchInput}
                    onSearchChange={setSearchInput}
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
    searchInput: string;
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
    searchInput,
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
                            value={searchInput}
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
