'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  RefreshCw,
  Printer,
  Download,
  ChevronDown,
  Filter,

  MoreHorizontal,
  Check,
  X,
  Inbox
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import api from '@/lib/api';
import InfiniteScroll from 'react-infinite-scroll-component';

import InvoiceForm from '@/components/business/InvoiceForm';

export default function InvoicesPage() {
  const router = useRouter();
  const {
    setActiveDataTab,
    openDataTab,
    closeDataTab,
    getActiveDataTab,
    activeFeatureTabId,
    featureTabs,
    updateDataTabData
  } = useTabContext();
  const featureId = '/dashboard/sales/faktur';

  // --- Tab State Logic ---
  const activeDataTab = getActiveDataTab();
  const activeTabId = activeDataTab?.id;

  const isListView = !activeTabId || activeTabId === `${featureId}-list`;
  const isFormView = activeTabId && (activeTabId === `${featureId}-new` || activeTabId.startsWith(`${featureId}-edit-`));

  // Extract ID/Data for Form
  const editId = activeTabId?.startsWith(`${featureId}-edit-`) ? activeTabId.replace(`${featureId}-edit-`, '') : null;
  const isNew = activeTabId === `${featureId}-new`;

  // Ensure List tab


  // --- Data Fetching State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Helper to deduplicate items
  const addUniqueInvoices = (existing: any[], incoming: any[]) => {
    const existingIds = new Set(existing.map(i => i.id));
    const uniqueIncoming = incoming.filter(i => !existingIds.has(i.id));
    return [...existing, ...uniqueIncoming];
  };

  const fetchInvoices = useCallback(async (pageToFetch: number, resetList = false) => {
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

      const response = await api.get('/fakturs', { params });
      const newData = response.data.data || [];
      const meta = response.data.meta || {};

      if (resetList) {
        setInvoices(newData);
      } else {
        setInvoices(prev => addUniqueInvoices(prev, newData));
      }

      setTotal(meta.total || 0);

      if (meta.total) {
        setHasMore((resetList ? newData.length : invoices.length + newData.length) < meta.total);
      } else {
        setHasMore(newData.length > 0);
      }

    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilters, dateFilter, customerFilter, invoices.length]);

  // Initial Fetch
  useEffect(() => {
    setPage(1);
    fetchInvoices(1, true);
  }, [fetchInvoices]);

  const fetchNextPage = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchInvoices(nextPage, false);
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
    fetchInvoices(1, true);
  };

  const handleRowClick = (invoice: any) => {
    const tabId = `${featureId}-edit-${invoice.id}`;
    openDataTab(featureId, {
      id: tabId,
      title: invoice.fakturNumber,
      href: featureId, // Stay on same route (SPA)
    });
  };

  const handleNewClick = () => {
    const tabId = `${featureId}-new`;
    openDataTab(featureId, {
      id: tabId,
      title: 'Data Baru',
      href: featureId, // Stay on same route (SPA)
    });
  };

  const handleCloseForm = () => {
    if (activeTabId) {
      closeDataTab(featureId, activeTabId);
    }
    handleRefresh();
  };

  // --- Form View Wrapper ---
  // We need to fetch data for Edit mode if not cached, or use default for New
  const [editData, setEditData] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Combine initial data with cache
  const cachedData = (activeDataTab?.data && Object.keys(activeDataTab.data).length > 0)
    ? activeDataTab.data
    : null;

  useEffect(() => {
    if (isFormView && editId && !activeDataTab?.data?.lines) {
      // Fetch only if we don't have cached full data (checking 'lines' as proxy for full load)
      // Check if we already have the correct data in editData to avoid re-fetch if just toggling view (optional, but good)
      if (editData && editData.id === editId) {
        return; // Already loaded matching data
      }

      const loadInvoice = async () => {
        setFormLoading(true);
        // Clear previous data to prevent flashing/poisoning
        setEditData(null);
        try {
          const res = await api.get(`/fakturs/${editId}`);
          setEditData(transformInvoiceData(res.data));
        } catch (e) {
          console.error(e);
        } finally {
          setFormLoading(false);
        }
      };
      loadInvoice();
    } else if (isNew) {
      // Ensure we don't hold onto old edit data
      if (editData !== null) setEditData(null);
    } else if (cachedData) {
      // If we have cache, we don't need editData (or can sync it), but cache takes precedence in logic below
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormView, editId, isNew, activeDataTab?.data?.lines]); // Removed cachedData dependency to avoid loops, used deep check

  const defaultNewData = {
    vendorCode: '',
    fakturDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    memo: '',
    lines: [],
  };

  // Safe Data Resolution
  // 1. Cached Data (User inputs in progress) - Highest Priority
  // 2. Edit Data (Fetched from API) - Only if IDs match!
  // 3. Default (If New)
  let formDataToRender = null;
  let isDataReady = false;

  if (cachedData && Object.keys(cachedData).length > 0) {
    formDataToRender = cachedData;
    isDataReady = true;
  } else if (isNew) {
    formDataToRender = defaultNewData;
    isDataReady = true;
  } else if (editId && editData && editData.id === editId) {
    formDataToRender = editData;
    isDataReady = true;
  }

  // Debug log to verify isolation (can be removed later)
  // console.log('Render Check:', { tab: activeTabId, editId, isNew, hasCache: !!cachedData, hasEditData: !!editData, isReady: isDataReady });

  // We use CSS toggling to keep List View alive (preserving scroll)
  // while showing Form View on top or replacing it visually.
  // Actually, standard practice for simple SPA is just Conditional, but user asked about Refresh.
  // To keep scroll, we must keep the Table in DOM and hide it.


  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden relative">

      {/* FORM VIEW OVERLAY */}
      <div className={cn(
        "absolute inset-0 z-20 bg-white flex flex-col transition-opacity duration-200",
        isFormView ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none hidden"
      )}>
        {isFormView && ( // We can still conditionally render content inside, just keeping container logic clean
          <>
            {(!isDataReady || formLoading) ? (
              <div className="flex h-full items-center justify-center gap-2 text-warmgray-500">
                <RefreshCw className="animate-spin h-6 w-6 text-primary-600" />
                <span>Memuat data...</span>
              </div>
            ) : (
              <InvoiceForm
                key={activeTabId || 'form'} // Key is CRITICAL here to force remount on tab switch
                initialData={formDataToRender}
                onDataChange={(data) => {
                  // Double check we are updating the active tab to avoid race conditions
                  if (activeTabId) updateDataTabData(featureId, activeTabId, data);
                }}
                onSave={() => {
                  handleCloseForm();
                }}
              />
            )}
          </>
        )}
      </div>


      {/* LIST VIEW CONTENT */}
      {/* 1. Header & Breadcrumbs */}
      <div className="flex items-center px-4 py-2 border-b border-surface-200 bg-surface-50 flex-none">
        <span className="text-xs font-semibold text-warmgray-500 uppercase tracking-wider">
          Sales / Sales Invoices
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

        {/* Multi-Select Status Filter */}
        <StatusFilterDropdown
          selected={statusFilters}
          onChange={handleStatusFilterChange}
        />

        <FilterButton label="Printed" value="All" />

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
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            onClick={() => handleRefresh()}
            className="flex items-center justify-center w-8 h-8 bg-white border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded-md shadow-sm transition-colors"
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
          dataLength={invoices.length}
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
                <Th>Number #</Th>
                <Th>Date</Th>
                <Th>Customer</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Sales Person</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {invoices.map((invoice: any, index: number) => {
                const badge = getStatusBadge(invoice.status);
                return (
                  <tr
                    key={`${invoice.id}-${index}`}
                    className={cn(
                      "hover:bg-primary-50 transition-colors cursor-pointer group",
                      index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                    )}
                    onClick={() => handleRowClick(invoice)}
                  >
                    <td className="px-4 py-2 text-center text-warmgray-400">
                      <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-primary-500" />
                    </td>
                    <td className="px-4 py-2 font-medium text-warmgray-900">{invoice.fakturNumber}</td>
                    <td className="px-4 py-2 text-warmgray-600 whitespace-nowrap">{formatDate(invoice.fakturDate)}</td>
                    <td className="px-4 py-2 text-warmgray-900 font-medium">{invoice.customerName}</td>
                    <td className="px-4 py-2 text-warmgray-600 truncate max-w-[200px]">{invoice.description}</td>
                    <td className="px-4 py-2">
                      <span className={cn("font-medium text-xs px-2 py-0.5 rounded-full inline-block", badge.className)}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-warmgray-600">{invoice.salesPerson}</td>
                    <td className="px-4 py-2 text-right font-bold text-warmgray-900">{formatCurrency(invoice.total)}</td>
                  </tr>
                )
              })}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-warmgray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="h-12 w-12 mb-3 text-warmgray-200" strokeWidth={1} />
                      <p className="font-medium text-warmgray-600">Tidak ada data faktur</p>
                      <p className="text-xs text-warmgray-400 mt-1">Silakan tambah faktur baru atau ubah filter pencarian</p>
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

// Helper to transform API data
const transformInvoiceData = (apiData: any) => {
  return {
    fakturNumber: apiData.fakturNumber,
    vendorCode: apiData.customer?.code || '',
    fakturDate: apiData.fakturDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    dueDate: apiData.dueDate?.split('T')[0] || '',
    memo: apiData.notes || '',
    currency: apiData.currency || 'IDR',
    id: apiData.id,
    salespersonId: apiData.salespersonId || '', // Map Salesperson
    lines: apiData.lines?.map((line: any) => ({
      id: line.id,
      itemId: line.itemId,
      itemCode: line.item?.code || '',
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.item?.uom || 'PCS',
      unitPrice: Number(line.unitPrice),
      discountPercent: Number(line.discountPercent || 0),
      discountAmount: Number(line.discountAmount || 0),
      taxPercent: 11,
      lineAmount: Number(line.amount),
      taxAmount: 0,
      totalAmount: Number(line.amount),
      warehouseId: line.warehouseId, // Map Warehouse ID
      warehouseName: line.warehouse?.name, // Map Warehouse Name for display
      salespersonId: apiData.salespersonId, // Line inherits invoice salesperson if not specific
      salespersonName: apiData.salesperson?.name // Map Salesperson Name
    })) || [],
  };
};

// Helper Components

function getStatusBadge(status: string) {
  switch (status) {
    case 'DRAFT': return { label: 'Draf', className: 'bg-gray-100 text-gray-700' };
    case 'PENDING': return { label: 'Diajukan', className: 'bg-blue-100 text-blue-700' }; // Assuming Pending is Blue-ish or Yellow
    case 'REJECTED': return { label: 'Ditolak', className: 'bg-red-100 text-red-700' };
    case 'UNPAID': return { label: 'Belum Lunas', className: 'bg-warmgray-200 text-warmgray-700' }; // Or ISSUED
    case 'ISSUED': return { label: 'Belum Lunas', className: 'bg-warmgray-200 text-warmgray-700' }; // Legacy support
    case 'PARTIAL': return { label: 'Belum Lunas', className: 'bg-warmgray-200 text-warmgray-700' }; // Mapped to Belum Lunas
    case 'PAID': return { label: 'Lunas', className: 'bg-green-100 text-green-700' };
    case 'OVERDUE': return { label: 'Jatuh Tempo', className: 'bg-red-100 text-red-700' };
    case 'CANCELLED': return { label: 'Dibatalkan', className: 'bg-gray-200 text-gray-700' };
    default: return { label: status, className: 'bg-gray-100 text-gray-700' };
  }
}

function FilterButton({ label, value, removable = false }: { label: string, value: string, removable?: boolean }) {
  return (
    <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs hover:bg-surface-200 transition-colors whitespace-nowrap">
      <span className="text-warmgray-500">{label}:</span>
      <span className="font-semibold text-warmgray-700">{value}</span>
      {removable ? (
        <span className="ml-1 text-warmgray-400 hover:text-danger-500">×</span>
      ) : (
        <ChevronDown className="h-3 w-3 text-warmgray-400" />
      )}
    </button>
  )
}

import { createPortal } from 'react-dom';

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

    // Update position on scroll/resize if open
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
    // If opening, ensure position is reset to null to force recalculated render?
    // Actually, setting open true triggers effect which sets position.
    // If we want to hide until ready, we can rely on position being null initially?
    // But effect is sync "ish".
    // Better:
    if (!open) {
      setPosition(null); // Reset on open to ensure we wait for calc
    }
    setOpen(!open);
  };

  const options = [
    { value: 'UNPAID', label: 'Belum Lunas' },
    { value: 'PENDING', label: 'Diajukan' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'DRAFT', label: 'Draf' },
    { value: 'PAID', label: 'Lunas' },
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
            top: position.top - window.scrollY, // Fixed position relative to viewport
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
      api.get('/customers', { params: { limit: 100 } }) // Assuming endpoint supports limit
        .then(res => {
          setCustomers(res.data.data || []);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open, customers.length]);

  // Close on click outside & Positioning (Reused logic)
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
    onChange(id === selectedId ? '' : id); // Toggle off if same, or set new
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

  // Internal state for the dropdown form
  const [mode, setMode] = useState<'range' | 'duration'>('range');
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [useEndDate, setUseEndDate] = useState(!!endDate);

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

      // Sync local state with props when opening
      setLocalStartDate(startDate);
      setLocalEndDate(endDate);
      setUseEndDate(!!endDate);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, startDate, endDate]);

  const handleToggle = () => {
    if (!open) setPosition(null);
    setOpen(!open);
  };

  const handleApply = () => {
    onChange(localStartDate, useEndDate ? localEndDate : '');
    setOpen(false);
  };

  const clearSelection = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    setUseEndDate(false);
    onChange('', '');
    setOpen(false);
  };

  const labelValue = !startDate ? 'Semua' :
    startDate && (!endDate || !useEndDate) ? formatDate(startDate) :
      `${formatDate(startDate)} - ${formatDate(endDate)}`;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs hover:bg-surface-200 transition-colors whitespace-nowrap"
      >
        <span className="text-warmgray-500">Tanggal:</span>
        <span className="font-semibold text-warmgray-700">{labelValue}</span>
        <ChevronDown className="h-3 w-3 text-warmgray-400" />
      </button>

      {open && position && typeof document !== 'undefined' && createPortal(
        <div
          id="date-filter-dropdown"
          className="fixed bg-white border border-surface-200 rounded-lg shadow-lg z-[9999] w-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: position.top - window.scrollY,
            left: position.left
          }}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-surface-100 flex justify-center">
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700"
            >
              <X className="h-3 w-3" />
              Kosongkan Pilihan
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Option 1: Specific Date */}
            <div className="flex gap-2 items-start">
              <div className="pt-1">
                <input
                  type="radio"
                  checked={mode === 'range'}
                  onChange={() => setMode('range')}
                  className="w-4 h-4 text-primary-600 border-warmgray-300 focus:ring-primary-500"
                />
              </div>
              <div className="flex-1 space-y-3">
                <label className="block text-sm font-medium text-warmgray-900" onClick={() => setMode('range')}>
                  Dari tanggal
                </label>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => {
                    setLocalStartDate(e.target.value);
                    setMode('range');
                  }}
                  className="w-full px-3 py-2 border border-warmgray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="enable-end-date"
                    checked={useEndDate}
                    onChange={(e) => {
                      setUseEndDate(e.target.checked);
                      setMode('range');
                    }}
                    className="rounded border-warmgray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="enable-end-date" className="text-sm font-medium text-warmgray-900 cursor-pointer">
                    Hingga tanggal
                  </label>
                </div>

                {useEndDate && (
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-warmgray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 animate-in fade-in slide-in-from-top-2 duration-200"
                  />
                )}
              </div>
            </div>

            {/* Option 2: Duration (Placeholder for now) */}
            <div className="flex gap-2 items-center">
              <input
                type="radio"
                checked={mode === 'duration'}
                onChange={() => setMode('duration')}
                className="w-4 h-4 text-primary-600 border-warmgray-300 focus:ring-primary-500"
              />
              <label className="text-sm text-warmgray-700 cursor-pointer" onClick={() => setMode('duration')}>
                Dalam durasi waktu terakhir
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-surface-50 border-t border-surface-200 flex justify-end">
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Update
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
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
