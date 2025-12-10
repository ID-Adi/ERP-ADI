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
    Save,
    X,
    Package,
    Settings,
    Paperclip,
    Trash,
    Check,
    Calendar
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import api from '@/lib/api';
import SearchableSelect from '@/components/ui/SearchableSelect';
import InfiniteScroll from 'react-infinite-scroll-component';
import { createPortal } from 'react-dom';

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
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [customerFilter, setCustomerFilter] = useState('');
    const [statusFilters, setStatusFilters] = useState<string[]>([]);

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

    const fetchReceipts = useCallback(async (pageToFetch: number, resetList = false) => {
        setLoading(true);
        try {
            const params: any = {
                page: pageToFetch,
                limit: 20
            };
            if (searchQuery) params.search = searchQuery;
            if (statusFilters.length > 0) params.status = statusFilters.join(',');

            // Add Date Filters
            if (dateFilter.start) params.startDate = dateFilter.start;
            if (dateFilter.end) params.endDate = dateFilter.end;

            // Add Customer Filter
            if (customerFilter) params.customerId = customerFilter;

            const res = await api.get('/sales-receipts', { params });
            const newData = res.data.data || [];
            const meta = res.data.meta || {};

            const mapped = newData.map((r: any) => transformReceiptData(r));

            if (resetList) {
                setItems(mapped);
            } else {
                setItems(prev => addUniqueItems(prev, mapped));
            }

            setTotal(meta.total || 0);

            if (meta.total) {
                setHasMore((resetList ? mapped.length : items.length + mapped.length) < meta.total);
            } else {
                setHasMore(mapped.length > 0);
            }

        } catch (err) {
            console.error("Failed to fetch receipts", err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilters, dateFilter, customerFilter, items.length]);

    // Initial Fetch
    useEffect(() => {
        setPage(1);
        fetchReceipts(1, true);
    }, [fetchReceipts]);

    const fetchNextPage = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchReceipts(nextPage, false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleStatusFilterChange = (selectedStatuses: string[]) => {
        setStatusFilters(selectedStatuses);
    };

    const handleDateFilterChange = (start: string, end: string) => {
        setDateFilter({ start, end });
    };

    const handleCustomerFilterChange = (customerId: string) => {
        setCustomerFilter(customerId);
    };

    const handleRefresh = () => {
        setPage(1);
        fetchReceipts(1, true);
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
            // If we have editingItem in list, maybe use it? But full fetch is safer for edits.
            const loadItem = async () => {
                setFormLoading(true);
                try {
                    // We might not have a direct GET /sales-receipts/:id but let's assume or use list find
                    // Typically detailed endpoint is better. If not, use list item.
                    const foundInList = items.find(i => i.id === editId);
                    if (foundInList && foundInList.raw) {
                        setEditData(foundInList.raw);
                    } else {
                        // Attempt fetch if endpoint exists, otherwise... fallback to list which might fail if paged out?
                        // Ideally backend supports /sales-receipts/:id
                        const res = await api.get(`/sales-receipts/${editId}`); // Assuming implementation exists
                        setEditData(res.data);
                    }
                } catch (e) {
                    console.error(e);
                    // Fallback to searching list wrapper if API fails
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
    }, [isFormView, editId, isNew, items]);

    let formDataToRender = null;
    let isDataReady = false;

    if (cachedData) {
        formDataToRender = cachedData;
        isDataReady = true;
    } else if (isNew) {
        formDataToRender = null; // Let form handle default
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
            {/* 1. Header & Breadcrumbs */}
            <div className="flex items-center px-4 py-2 border-b border-surface-200 bg-surface-50 flex-none">
                <span className="text-xs font-semibold text-warmgray-500 uppercase tracking-wider">
                    Sales / Sales Receipts (Penerimaan)
                </span>
            </div>

            {/* 2. Filter Bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-200 bg-white overflow-x-auto flex-none">
                <DateFilterDropdown
                    startDate={dateFilter.start}
                    endDate={dateFilter.end}
                    onChange={handleDateFilterChange}
                />
                <CustomerFilterDropdown
                    selectedId={customerFilter}
                    onChange={handleCustomerFilterChange}
                />
                <StatusFilterDropdown
                    selected={statusFilters}
                    onChange={handleStatusFilterChange}
                />
                <button className="p-1.5 hover:bg-surface-100 rounded-md text-primary-600">
                    <Filter className="h-4 w-4" />
                </button>
            </div>

            {/* 3. Toolbar (Actions) */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewClick}
                        className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm transition-colors"
                        title="Buat Baru"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center justify-center w-8 h-8 bg-white border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded-md shadow-sm transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Action Buttons Group */}
                    <div className="flex items-center border border-surface-300 rounded bg-white">
                        <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 rounded-l transition-colors">
                            <Download className="h-4 w-4" />
                        </button>
                        <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 transition-colors">
                            <Printer className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex items-center border border-surface-300 rounded overflow-hidden bg-white">
                        <span className="px-3 py-1.5 text-sm text-warmgray-500 bg-white">Cari...</span>
                        <input
                            type="text"
                            placeholder=""
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-32 px-2 py-1.5 text-sm bg-white border-l border-surface-200 focus:outline-none focus:ring-0 placeholder:text-warmgray-400"
                        />
                    </div>

                    {/* Total Count Display */}
                    <div className="flex items-center justify-center h-8 px-3 border border-surface-300 bg-surface-50 text-warmgray-600 rounded text-xs font-medium whitespace-nowrap">
                        {total} Data
                    </div>
                </div>
            </div>

            {/* 4. Dense Data Table */}
            <div id="scrollableDiv" className="flex-1 overflow-auto relative">
                <InfiniteScroll
                    dataLength={items.length}
                    next={fetchNextPage}
                    hasMore={hasMore}
                    loader={
                        <div className="flex justify-center p-4">
                            <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    }
                    scrollableTarget="scrollableDiv"
                >
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10 w-full">
                            <tr>
                                <th scope="col" className="px-4 py-2.5 font-semibold w-12 text-center">
                                    &nbsp;
                                </th>
                                <Th>No. Kwitansi</Th>
                                <Th>Tanggal</Th>
                                <Th>Pelanggan</Th>
                                <Th>No. Faktur</Th>
                                <Th>Metode</Th>
                                <Th>Status</Th>
                                <Th className="text-right">Nilai</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200">
                            {items.map((item: any, index: number) => {
                                const badge = getStatusBadge(item.status);
                                return (
                                    <tr
                                        key={`${item.id}-${index}`}
                                        className={cn(
                                            "hover:bg-primary-50 transition-colors cursor-pointer group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                        )}
                                        onClick={() => handleRowClick(item)}
                                    >
                                        <td className="px-4 py-2 text-center text-warmgray-400">
                                            <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-primary-500" />
                                        </td>
                                        <td className="px-4 py-2 font-medium text-warmgray-900">{item.receiptNumber}</td>
                                        <td className="px-4 py-2 text-warmgray-600 whitespace-nowrap">{formatDate(item.receiptDate)}</td>
                                        <td className="px-4 py-2 text-warmgray-900 font-medium">{item.customerName}</td>
                                        <td className="px-4 py-2 text-warmgray-600 font-mono text-xs">{item.invoiceNumber}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{item.paymentMethod || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className={cn("font-medium text-xs px-2 py-0.5 rounded-full inline-block", badge.className)}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold text-warmgray-900">{formatCurrency(item.amount)}</td>
                                    </tr>
                                )
                            })}
                            {items.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-warmgray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <RefreshCw className="h-8 w-8 mb-2 text-warmgray-300" />
                                            <p>Tidak ada data penerimaan</p>
                                        </div>
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

// --- Logic Helpers ---

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

// --- UI Helpers ---

function Th({ children, className, align = 'left' }: { children: React.ReactNode, className?: string, align?: 'left' | 'right' | 'center' }) {
    return (
        <th scope="col" className={cn("px-4 py-2.5 font-semibold whitespace-nowrap", className, align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left')}>
            {children}
        </th>
    )
}

function Tooltip({ children, text }: { children: React.ReactNode, text: string }) {
    return (
        <div className="group relative flex">
            {children}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {text}
            </span>
        </div>
    )
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
        if (!open) {
            setPosition(null);
        }
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

    // Data State
    const [customers, setCustomers] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Fetch Customers on Open
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

    // Close on click outside & Positioning
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
                    {/* Search Header */}
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

                    {/* List */}
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

    // Close on click outside
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
                            <label className="text-xs text-warmgray-500 block mb-1">Mulai</label>
                            <input
                                type="date"
                                className="w-full text-sm border-surface-300 rounded"
                                value={localStartDate}
                                onChange={(e) => setLocalStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-warmgray-500 block mb-1">Sampai</label>
                            <input
                                type="date"
                                className="w-full text-sm border-surface-300 rounded"
                                value={localEndDate}
                                onChange={(e) => setLocalEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between pt-2 border-t border-surface-100">
                            <button onClick={handleReset} className="text-xs text-warmgray-500 hover:text-warmgray-700">Reset</button>
                            <button onClick={handleApply} className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700">Terapkan</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}


// ============================================================================
// FORM VIEW (Minimally Modified for Integration)
// ============================================================================
function ReceiptForm({ initialData, onCancel, onSuccess }: { initialData?: any, onCancel: () => void, onSuccess: () => void }) {
    const isEdit = !!initialData;
    const [bankOptions, setBankOptions] = useState<any[]>([]);
    const [customerOptions, setCustomerOptions] = useState<any[]>([]);
    const [invoiceOptions, setInvoiceOptions] = useState<any[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        customerId: initialData?.customerId || '',
        customerName: initialData?.customer?.name || '',
        bankId: initialData?.bankAccountId || '',
        bankName: initialData?.bankAccount?.name || '',
        receiptNumber: initialData?.receiptNumber || '',
        receiptDate: initialData?.receiptDate ? new Date(initialData.receiptDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: initialData ? Number(initialData.amount) : 0,
        notes: initialData?.notes || '',
        status: initialData?.status || 'POSTED',
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
            status: formData.status, // Preserve status? Usually SAVE implies POSTED unless distinct Draft button.
            lines
        };

        try {
            await api.post('/sales-receipts', finalPayload);
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
        if (!confirm("Apakah Anda yakin ingin menghapus/membatalkan penerimaan ini?")) return;

        try {
            await api.delete(`/sales-receipts/${initialData.id}`);
            onSuccess();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menghapus");
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-surface-200 flex-none shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-warmgray-800">
                        {isEdit ? formData.receiptNumber : 'Data Baru'}
                    </span>
                    <button onClick={onCancel} className="p-1 hover:bg-surface-100 rounded text-warmgray-500">
                        <X className="h-4 w-4" />
                    </button>
                    {isEdit && formData.status !== 'CANCELLED' && (
                        <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full",
                            formData.status === 'POSTED' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        )}>{formData.status}</span>
                    )}
                    {isEdit && formData.status === 'CANCELLED' && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">CANCELLED</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* ACTION BUTTONS */}
                    {isEdit && formData.status !== 'CANCELLED' && (
                        <button
                            onClick={handleDelete}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded shadow-sm border border-red-200"
                            title="Hapus / Batalkan"
                        >
                            <Trash className="h-5 w-5" />
                        </button>
                    )}

                    {(!isEdit || formData.status === 'DRAFT') && (
                        <Tooltip text="Simpan">
                            <button
                                onClick={handleSave}
                                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-sm"
                            >
                                <Save className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    )}

                    <Tooltip text="Cetak">
                        <button className="p-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded shadow-sm border border-primary-200">
                            <Printer className="h-5 w-5" />
                        </button>
                    </Tooltip>
                    <Tooltip text="Lampiran">
                        <button className="p-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded shadow-sm border border-primary-200">
                            <Paperclip className="h-5 w-5" />
                        </button>
                    </Tooltip>
                    <Tooltip text="Pengaturan">
                        <button className="p-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded shadow-sm border border-primary-200">
                            <Settings className="h-5 w-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Top Form Section */}
            <div className="p-4 bg-surface-50 flex-none">
                <div className="grid grid-cols-12 gap-6 bg-surface-50">
                    {/* Left Column */}
                    <div className="col-span-8 space-y-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <label className="col-span-2 text-sm font-medium text-warmgray-700">
                                Terima dari <span className="text-red-500">*</span>
                            </label>
                            <div className="col-span-10 max-w-lg">
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
                                    placeholder="Cari/Pilih Pelanggan..."
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-center">
                            <label className="col-span-2 text-sm font-medium text-warmgray-700">
                                Bank <span className="text-red-500">*</span>
                            </label>
                            <div className="col-span-10 max-w-lg">
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
                                    placeholder="Cari/Pilih..."
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-center">
                            <label className="col-span-2 text-sm font-medium text-warmgray-700">
                                Nilai Pembayaran
                            </label>
                            <div className="col-span-10 flex gap-2 max-w-lg">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-1.5 text-sm border border-surface-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                    value={formData.amount > 0 ? formatCurrency(formData.amount) : ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setFormData({ ...formData, amount: Number(val) });
                                    }}
                                    placeholder="0"
                                />
                                <button
                                    onClick={handlePayAll}
                                    title="Bayar Sesuai Total Faktur"
                                    className="p-1.5 border border-surface-300 bg-white rounded text-primary-600 hover:bg-surface-50"
                                >
                                    <Package className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-4 space-y-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <label className="col-span-4 text-sm font-medium text-warmgray-700 text-right pr-2">
                                Tgl Bayar <span className="text-red-500">*</span>
                            </label>
                            <div className="col-span-8 relative">
                                <input
                                    type="date"
                                    className="w-full px-3 py-1.5 text-sm border border-surface-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    value={formData.receiptDate}
                                    onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section - Toolbar & Table */}
            <div className="flex-1 flex flex-col bg-white border-t border-surface-200 mt-2 mx-4 rounded-t-lg shadow-sm">

                {/* Search / Toolbar */}
                <div className="p-2 border-b border-surface-200 flex items-center justify-between bg-surface-50 rounded-t-lg">
                    <div className="flex-1 max-w-lg relative">
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
                            placeholder="Cari No. Faktur..."
                            className="w-full"
                            disabled={!formData.customerId}
                        />
                    </div>
                    <div className="ml-4 flex items-center">
                        <span className="text-sm font-medium text-warmgray-700">Faktur <span className="text-red-500">*</span></span>
                    </div>
                </div>

                {/* Table Header */}
                <div className="flex-1 overflow-auto bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white uppercase bg-warmgray-600 sticky top-0 z-10">
                            <tr>
                                <Th className="text-white">No. Faktur</Th>
                                <Th className="text-white">Tgl Faktur</Th>
                                <Th className="text-white text-right">Total Faktur</Th>
                                <Th className="text-white text-right">Terutang</Th>
                                <Th className="text-white text-right">Bayar</Th>
                                <Th className="text-white text-right">Diskon</Th>
                                <Th className="text-white text-right">Pembayaran</Th>
                                <th className="px-4 py-2 w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedInvoices.length > 0 ? (
                                selectedInvoices.map((inv, index) => (
                                    <tr key={inv.id} className="border-b border-surface-100 hover:bg-surface-50">
                                        <td className="px-4 py-2 font-medium">{inv.fakturNumber}</td>
                                        <td className="px-4 py-2">{inv.fakturDate}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(inv.total)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(inv.total - (inv.amountPaid || 0))}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(inv.thisPayment || (inv.total - (inv.amountPaid || 0)))}</td>
                                        <td className="px-4 py-2 text-right">0</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(inv.thisPayment || (inv.total - (inv.amountPaid || 0)))}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => {
                                                    const newInvoices = [...selectedInvoices];
                                                    newInvoices.splice(index, 1);
                                                    setSelectedInvoices(newInvoices);
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-warmgray-500">
                                        Belum ada data
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Total Section */}
            <div className="bg-surface-100 p-4 border-t border-surface-200 mt-auto flex justify-end gap-8">
                <div className="text-right">
                    <p className="text-sm font-medium text-warmgray-600">Nilai Pembayaran</p>
                    <p className="text-lg font-bold text-warmgray-900">{formatCurrency(formData.amount)}</p>
                </div>
            </div>

        </div>
    );
}

