'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    RefreshCw,
    Printer,
    Import,
    ChevronDown,
    Filter,
    Save,
    X,
    Package,
    Settings,
    FileDown,
    Trash,
    Check
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import { confirmAction } from '@/lib/swal';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import SearchableSelect from '@/components/ui/SearchableSelect';
// Updated imports to point to original location
import ImportView from '@/app/dashboard/inventory/items/ImportView';
import StockModal from '@/app/dashboard/inventory/items/StockModal';

import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/ui';

import api from '@/lib/api';

import InfiniteScroll from 'react-infinite-scroll-component';

export default function ItemsView() {
    const router = useRouter();
    const {
        setActiveDataTab,
        openDataTab,
        closeDataTab,
        getActiveDataTab,
        activeFeatureTabId,
        featureTabs
    } = useTabContext();
    const featureId = '/dashboard/inventory/items';

    // Data state
    const [searchInput, setSearchInput] = useState('');
    const searchQuery = useDebounce(searchInput, 500);
    const [filters, setFilters] = useState({
        status: 'Semua',
        category: 'Semua',
        type: 'Semua', // Jenis Barang
        brand: 'Semua'
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
        try {
            const params: any = {
                limit: 50,
                page: 1,
            };
            if (searchQuery) params.search = searchQuery;
            if (filters.status !== 'Semua') params.status = filters.status;
            if (filters.category !== 'Semua') params.category = filters.category;
            if (filters.type !== 'Semua') params.type = filters.type;
            if (filters.brand !== 'Semua') params.brand = filters.brand;

            const response = await api.get('/items', { params });
            const newData = response.data.data || [];
            const meta = response.data.meta || {};

            setItems(newData);
            setTotal(meta.total || 0);

            if (meta.total) {
                setHasMore(newData.length < meta.total);
            } else {
                setHasMore(newData.length > 0);
            }

        } catch (error) {
            console.error('Error fetching items:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        const nextPage = page + 1;
        try {
            const params: any = {
                limit: 50,
                page: nextPage,
            };
            if (searchQuery) params.search = searchQuery;
            if (filters.status !== 'Semua') params.status = filters.status;
            if (filters.category !== 'Semua') params.category = filters.category;
            if (filters.type !== 'Semua') params.type = filters.type;
            if (filters.brand !== 'Semua') params.brand = filters.brand;

            const response = await api.get('/items', { params });
            const newData = response.data.data || [];
            const meta = response.data.meta || {};

            setItems(prev => addUniqueItems(prev, newData));
            setPage(nextPage);

            if (newData.length === 0 || items.length + newData.length >= (meta.total || total)) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching more items:', error);
            setHasMore(false);
        }
    }, [page, searchQuery, filters, items.length, total]);

    // Initial load
    useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);


    // Derived state from TabContext
    const activeDataTab = getActiveDataTab();
    const activeTabId = activeDataTab?.id;

    const isListView = !activeTabId || activeTabId === `${featureId}-list`;
    const isFormView = activeTabId && (activeTabId === `${featureId}-new` || activeTabId.startsWith(`${featureId}-edit-`) || activeTabId === `${featureId}-import`);

    // Extract ID for edit if applicable
    const isImportView = activeTabId === `${featureId}-import`;
    const editId = activeTabId?.startsWith(`${featureId}-edit-`) ? activeTabId.replace(`${featureId}-edit-`, '') : null;
    const editingItem = editId ? items.find(i => i.id === editId) : null;

    const handleRowClick = (item: any) => {
        openDataTab(featureId, {
            id: `${featureId}-edit-${item.id}`,
            title: item.name,
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

    const handleImportClick = () => {
        openDataTab(featureId, {
            id: `${featureId}-import`,
            title: 'Import Barang',
            href: featureId
        });
    };

    const handleCancelForm = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchFirstPage(); // Refresh data after save/cancel
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden relative">

            {/* FORM VIEW OVERLAY */}
            <div className={cn(
                "absolute inset-0 z-20 bg-white flex flex-col transition-opacity duration-200",
                isFormView ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none hidden"
            )}>
                {isFormView && !isImportView && (
                    <ItemForm
                        key={activeTabId || 'form'}
                        initialData={editingItem}
                        onCancel={handleCancelForm}
                    />
                )}
                {isImportView && (
                    <ImportView onCancel={handleCancelForm} />
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
                    onImportClick={handleImportClick}
                    filters={filters}
                    onFilterChange={setFilters}

                    // Infinite Scroll Props
                    total={total}
                    hasMore={hasMore}
                    fetchMore={fetchNextPage}
                    onRefresh={fetchFirstPage}
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
    onImportClick: () => void;
    filters: {
        status: string;
        category: string;
        type: string;
        brand: string;
    };
    onFilterChange: (filters: any) => void;

    // Infinite Scroll
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
    onImportClick,
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
                    <FilterButton
                        label="Non Aktif"
                        value={filters.status === 'Non Aktif' ? 'Ya' : 'Semua'}
                        onClick={() => onFilterChange({ ...filters, status: filters.status === 'Non Aktif' ? 'Semua' : 'Non Aktif' })}
                    />
                    <FilterButton
                        label="Kategori Barang"
                        value={filters.category}
                        onClick={() => {
                            const options = ['Semua', 'Umum', 'Elektronik', 'Furniture'];
                            const currentIndex = options.indexOf(filters.category) !== -1 ? options.indexOf(filters.category) : 0;
                            const nextIndex = (currentIndex + 1) % options.length;
                            onFilterChange({ ...filters, category: options[nextIndex] });
                        }}
                    />
                    <FilterButton
                        label="Jenis Barang"
                        value={filters.type}
                        onClick={() => {
                            const options = ['Semua', 'Persediaan', 'Jasa'];
                            const currentIndex = options.indexOf(filters.type) !== -1 ? options.indexOf(filters.type) : 0;
                            const nextIndex = (currentIndex + 1) % options.length;
                            onFilterChange({ ...filters, type: options[nextIndex] });
                        }}
                    />
                    <FilterButton
                        label="Merek Barang"
                        value={filters.brand}
                        onClick={() => {
                            const brand = prompt('Masukkan nama merek (kosongkan untuk Semua):', filters.brand === 'Semua' ? '' : filters.brand);
                            if (brand !== null) {
                                onFilterChange({ ...filters, brand: brand || 'Semua' });
                            }
                        }}
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
                                onClick={onImportClick}
                                className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 rounded-l transition-colors"
                            >
                                <Import className="h-4 w-4" />
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
                                <Th>Nama Barang</Th>
                                <Th>Kode Barang</Th>
                                <Th>Jenis Barang</Th>
                                <Th>Satuan</Th>
                                <Th align="right">Kts (Gdng Pengguna)</Th>
                                <Th align="right">Stok dapat dijual</Th>
                                <Th></Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200">
                            {items.map((item, index) => {
                                return (
                                    <tr
                                        key={item.id}
                                        className={cn(
                                            "hover:bg-primary-50 transition-colors cursor-pointer group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                        )}
                                        onClick={() => onRowClick(item)}
                                    >
                                        <td className="px-4 py-2 font-medium text-warmgray-900">{item.name}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{item.code}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{item.type}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{item.unit}</td>
                                        <td className="px-4 py-2 text-warmgray-600 text-right">{item.warehouseQty}</td>
                                        <td className="px-4 py-2 text-warmgray-600 text-right">{item.sellableStock}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{item.isActive ? '' : 'Tidak'}</td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-warmgray-500">
                                        <Package className="h-12 w-12 mx-auto mb-3 text-warmgray-300" />
                                        <p>Tidak ada data barang</p>
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
// FORM VIEW (Create & Edit)
// ============================================================================
// Imports are already at the top of the file

function ItemForm({ initialData, onCancel }: { initialData?: any, onCancel: () => void }) {
    const isEdit = !!initialData;
    const { getActiveDataTab, updateDataTabData, activeFeatureTabId, markDataTabDirty } = useTabContext();
    const featureId = '/dashboard/inventory/items';

    // Determine current tab ID based on edit/new
    // We can infer it from the active data tab since ItemForm is only rendered when a specific tab is active
    const activeDataTab = getActiveDataTab();
    const tabId = activeDataTab?.id;

    // Retrieve cached data if available (and matches current tab to be safe)
    const cachedData = (activeDataTab?.data && Object.keys(activeDataTab.data).length > 0)
        ? activeDataTab.data
        : null;

    const [subTab, setSubTab] = useState('umum');
    const [submitting, setSubmitting] = useState(false);
    const { addToast } = useToast();

    // Form State - Initialize with CACHED data if available, else Initial, else Default
    // We cast cachedData to any to match expected shape
    const defaultState = {
        name: initialData?.name || '',
        categoryId: initialData?.categoryId || 'Umum',
        type: initialData?.type || 'Persediaan',
        code: initialData?.code || '',
        upc: initialData?.upc || '',
        unit: initialData?.unit || 'Pcs',
        brand: initialData?.brand || '',
        description: initialData?.description || '',
        isStockItem: initialData?.isStockItem ?? true,
        isActive: initialData?.isActive ?? true,
        // Sales/Purchase
        sellPrice: initialData?.sellPrice || 0,
        purchasePrice: initialData?.purchasePrice || 0,
        minStock: initialData?.minStock || 0,
        // Additional fields
        defaultDiskon: initialData?.defaultDiskon || 0,
        defHrgJual: initialData?.defHrgJual || 0,
        minimumJual: initialData?.minimumJual || 0,
        terapkanHargaGrosir: initialData?.terapkanHargaGrosir || false,
        substitusiDengan: initialData?.substitusiDengan || false,
        pemasokUtama: initialData?.pemasokUtama || '',
        satuanBeli: initialData?.satuanBeli || '',
        hargaBeli: initialData?.hargaBeli || 0,
        minimumBeli: initialData?.minimumBeli || 0,
        batasMinimumStok: initialData?.batasMinimumStok || 0,
        refKodePajak: initialData?.refKodePajak || '',
        ppn: initialData?.ppn || '',
        idHppPky: initialData?.idHppPky || '',

        // Accounts State (Mapped by internal ID)
        accounts: initialData?.accounts ?
            initialData.accounts.reduce((acc: any, curr: any) => {
                const fieldId = Object.keys(ACCOUNT_MAPPING).find(key => ACCOUNT_MAPPING[key] === curr.accountType);
                if (fieldId) acc[fieldId] = curr.accountId;
                return acc;
            }, {})
            : {},
        openingStocks: initialData?.openingStocks || [],
        deletedStockIds: []
    };

    const [formData, setFormData] = useState({
        ...defaultState,
        ...(cachedData as any || {})
    });

    // Lifted autoCode state to handle validation correctly
    const [autoCode, setAutoCode] = useState(!isEdit && !formData.code);

    const [accountList, setAccountList] = useState<any[]>([]);

    const handleChange = (field: string, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);

        // Persist to TabContext
        if (tabId) {
            updateDataTabData(featureId, tabId, newData);
        }
    };

    const handleSave = async () => {
        // Validation: Name is required. Code is required UNLESS autoCode is true.
        if (!formData.name || (!formData.code && !autoCode)) {
            addToast({
                type: 'error',
                title: 'Data Tidak Lengkap',
                message: 'Nama Barang dan Kode Barang wajib diisi',
            });
            return;
        }

        setSubmitting(true);
        try {
            // Process Stock Deletions First (User Request: "delete first from api")
            // This ensures logic is clear: Remove unwanted stocks from DB before updating item.
            if (isEdit && formData.deletedStockIds && formData.deletedStockIds.length > 0) {
                for (const stockId of formData.deletedStockIds) {
                    try {
                        await api.delete(`/items/transactions/${stockId}`);
                    } catch (err) {
                        console.error(`Failed to delete stock transaction ${stockId}`, err);
                        // We continue even if one fails, or should we abort? 
                        // Usually safer to continue to attempt to save the rest.
                    }
                }
            }

            if (isEdit) {
                // Transform accounts state back to array for API
                const payload = {
                    ...formData,
                    accounts: Object.entries(formData.accounts).map(([key, value]) => ({
                        accountType: ACCOUNT_MAPPING[key],
                        accountId: value
                    }))
                };
                await api.put(`/items/${initialData.id}`, payload);
                addToast({
                    type: 'success',
                    title: 'Berhasil',
                    message: 'Barang berhasil diperbarui',
                });
            } else {
                const payload = {
                    ...formData,
                    accounts: Object.entries(formData.accounts).map(([key, value]) => ({
                        accountType: ACCOUNT_MAPPING[key],
                        accountId: value
                    }))
                };
                await api.post('/items', payload);
                addToast({
                    type: 'success',
                    title: 'Berhasil',
                    message: 'Barang berhasil disimpan',
                });
            }
            onCancel(); // Back to list and refresh
        } catch (error: any) {
            console.error('Error saving item:', error);
            addToast({
                type: 'error',
                title: 'Gagal Menyimpan',
                message: error.response?.data?.error || 'Gagal menyimpan barang',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const subTabs = [
        { id: 'umum', label: 'Umum' },
        { id: 'penjualan-pembelian', label: 'Penjualan / Pembelian' },
        { id: 'stok', label: 'Stok' },
        { id: 'akun', label: 'Akun' },
        { id: 'lain-lain', label: 'Lain-lain' },
    ];

    const [units, setUnits] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [unitsRes, categoriesRes, accountsRes, warehousesRes] = await Promise.all([
                    api.get('/units'),
                    api.get('/categories'),
                    api.get('/accounts', { params: { limit: 1000 } }),
                    api.get('/warehouses')
                ]);

                const unitsData = unitsRes.data.data || unitsRes.data;
                const categoriesData = categoriesRes.data.data || categoriesRes.data;
                const accountsData = accountsRes.data.data || accountsRes.data;
                const warehousesData = warehousesRes.data.data || warehousesRes.data;

                setUnits(Array.isArray(unitsData) ? unitsData : []);
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                setAccountList(Array.isArray(accountsData) ? accountsData : []);
                setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);

                // Auto-populate defaults for new items
                if (!isEdit && Array.isArray(accountsData)) {
                    const defaults: any = {};
                    const findAcc = (code: string) => accountsData.find((a: any) => a.code === code || a.code.startsWith(code));

                    // 1. Persediaan -> [110401] Persediaan
                    const accPersediaan = findAcc('110401');
                    if (accPersediaan) defaults.persediaan = accPersediaan.id;

                    // 2. Penjualan -> [400001] Penjualan
                    const accPenjualan = findAcc('400001');
                    if (accPenjualan) defaults.penjualan = accPenjualan.id;

                    // 3. Retur Penjualan -> [400003] Retur Penjualan
                    const accReturPenjualan = findAcc('400003');
                    if (accReturPenjualan) defaults.returPenjualan = accReturPenjualan.id;

                    // 4. Diskon Penjualan -> [400004] Diskon Penjualan
                    const accDiskonPenjualan = findAcc('400004');
                    if (accDiskonPenjualan) defaults.diskonPenjualan = accDiskonPenjualan.id;

                    // 5. Barang Terkirim -> [110402] Persediaan Terkirim
                    const accBarangTerkirim = findAcc('110402');
                    if (accBarangTerkirim) defaults.barangTerkirim = accBarangTerkirim.id;

                    // 6. Beban Pokok Penjualan -> [5101] Beban Pokok Penjualan
                    const accCOGS = findAcc('5101');
                    if (accCOGS) defaults.bebanPokokPenjualan = accCOGS.id;

                    // 7. Retur Pembelian -> [110401] Persediaan (Same as Inventory)
                    if (accPersediaan) defaults.returPembelian = accPersediaan.id;

                    // 8. Pembelian Belum Tertagih -> [210203] Hutang Pembelian Belum Ditagih
                    const accPembelianBelumTertagih = findAcc('210203');
                    if (accPembelianBelumTertagih) defaults.pembelianBelumTertagih = accPembelianBelumTertagih.id;

                    if (Object.keys(defaults).length > 0) {
                        setFormData((prev: any) => ({
                            ...prev,
                            accounts: { ...prev.accounts, ...defaults }
                        }));
                    }
                }

            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, [isEdit]);

    // Fetch FULL item details on mount if editing
    useEffect(() => {
        const fetchItemDetails = async () => {
            if (isEdit && initialData?.id) {
                try {
                    const response = await api.get(`/items/${initialData.id}`);
                    const fullData = response.data.data;

                    if (fullData) {
                        setFormData(prev => ({
                            ...prev,
                            // Merge all relevant fields from fullData
                            openingStocks: fullData.openingStocks || [],
                            // Ensure accounts and other nested structures are mapped if needed
                            accounts: fullData.accounts ?
                                fullData.accounts.reduce((acc: any, curr: any) => {
                                    const fieldId = Object.keys(ACCOUNT_MAPPING).find(key => ACCOUNT_MAPPING[key] === curr.accountType);
                                    if (fieldId) acc[fieldId] = curr.accountId;
                                    return acc;
                                }, {})
                                : prev.accounts
                        }));
                    }
                } catch (error) {
                    console.error('Failed to fetch item details:', error);
                }
            }
        };
        fetchItemDetails();
    }, [isEdit, initialData?.id]);

    return (
        <div className="flex flex-col h-full bg-surface-50">

            {/* Sub Tabs */}
            <div className="px-6 pt-4 bg-white border-b border-surface-200 flex-none">
                <div className="flex items-center gap-6">
                    {subTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSubTab(tab.id)}
                            className={cn(
                                "pb-3 text-sm font-medium border-b-2 transition-colors",
                                subTab === tab.id
                                    ? "border-primary-600 text-primary-700"
                                    : "border-transparent text-warmgray-500 hover:text-warmgray-800 hover:border-warmgray-300"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-6xl mx-auto">
                    {subTab === 'umum' && <TabUmum
                        data={formData}
                        onChange={handleChange}
                        units={units}
                        categories={categories}
                        isEdit={isEdit}
                        autoCode={autoCode}
                        setAutoCode={setAutoCode}
                    />}
                    {subTab === 'penjualan-pembelian' && <TabPenjualanPembelian data={formData} onChange={handleChange} />}
                    {subTab === 'stok' && <TabStok data={formData} onChange={handleChange} warehouses={warehouses} units={units} isEdit={isEdit} />}
                    {subTab === 'akun' && <TabAkun data={formData} onChange={handleChange} accountList={accountList} />}
                    {subTab === 'lain-lain' && <TabLainLain />}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-white border-t border-warmgray-300 px-6 py-3 flex items-center justify-end gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 flex-none">


                {isEdit && (
                    <Tooltip text="Hapus Barang">
                        <button
                            onClick={async () => {
                                if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
                                    setSubmitting(true);
                                    try {
                                        await api.delete(`/items/${initialData.id}`);
                                        alert('Barang berhasil dihapus');
                                        onCancel();
                                    } catch (error: any) {
                                        console.error('Error deleting item:', error);
                                        alert(error.response?.data?.error || 'Gagal menghapus barang');
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }
                            }}
                            disabled={submitting}
                            className="p-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                        >
                            <Trash className="h-6 w-6" />
                        </button>
                    </Tooltip>
                )}

                <Tooltip text="Simpan Barang">
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="p-3 bg-[#d95d39] hover:bg-[#c44e2b] text-white border border-transparent rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                    >
                        <Save className="h-6 w-6" />
                    </button>
                </Tooltip>
            </div>
        </div>
    );
}

// ============================================================================
// TAB: UMUM
// ============================================================================
// ============================================================================
// TAB: UMUM
// ============================================================================
function TabUmum({
    data,
    onChange,
    units = [],
    categories = [],
    isEdit = false,
    autoCode = false,
    setAutoCode = () => { }
}: {
    data: any,
    onChange: (field: string, value: any) => void,
    units?: any[],
    categories?: any[],
    isEdit?: boolean,
    autoCode?: boolean,
    setAutoCode?: (val: boolean) => void
}) {
    // Sync autoCode with disabled state logic
    useEffect(() => {
        if (!isEdit && autoCode) {
            // Optional: clear code if auto is selected
            // onChange('code', ''); // Avoiding loop, only if needed
        }
    }, [autoCode, isEdit]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Identifikasi Barang" className="h-full">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Barang <span className="text-danger-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder="Contoh: ACP Seven..."
                            className="w-full px-3 h-[38px] border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-warmgray-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kode Barang <span className="text-danger-600">*</span>
                        </label>
                        <div className="flex gap-2 items-center">
                            {/* Toggle Switch (Only visible for NEW items) */}
                            {!isEdit && (
                                <div
                                    className="flex items-center justify-center h-[38px] px-2 cursor-pointer group rounded border border-transparent hover:bg-warmgray-50 transition-colors"
                                    onClick={() => {
                                        const newState = !autoCode;
                                        setAutoCode(newState);
                                        if (newState) onChange('code', ''); // Clear code if auto
                                    }}
                                    title={!autoCode ? "Mode Manual Aktif" : "Mode Auto-Generated"}
                                >
                                    <div className={cn(
                                        "w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out flex-shrink-0",
                                        !autoCode ? "bg-primary-500" : "bg-warmgray-300 group-hover:bg-warmgray-400"
                                    )}>
                                        <div className={cn(
                                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm",
                                            !autoCode ? "translate-x-4.5" : "translate-x-0.5"
                                        )} style={{ transform: !autoCode ? 'translateX(18px)' : 'translateX(2px)' }} />
                                    </div>
                                </div>
                            )}

                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => {
                                        onChange('code', e.target.value);
                                        if (e.target.value) setAutoCode(false); // Disable auto if user types
                                    }}
                                    className={cn(
                                        "w-full px-3 h-[38px] border rounded text-sm font-medium transition-all focus:outline-none",
                                        (!autoCode || isEdit)
                                            ? "bg-white border-warmgray-300 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-warmgray-900"
                                            : "bg-warmgray-100 border-warmgray-200 text-warmgray-500 cursor-not-allowed select-none"
                                    )}
                                    placeholder={autoCode ? "Kode akan digenerate otomatis..." : "Masukkan kode barang"}
                                    disabled={isEdit || autoCode}
                                />
                                {/* Optional Icon if desired */}
                            </div>
                        </div>
                    </div>

                    <SearchableSelect
                        label="Jenis Barang"
                        value={data.type}
                        onChange={(val) => onChange('type', val)}
                        placeholder="Pilih Jenis Barang..."
                        options={[
                            { label: 'Persediaan', value: 'Persediaan' },
                            { label: 'Jasa', value: 'Jasa' },
                            { label: 'Non-Persediaan', value: 'Non-Persediaan' }
                        ]}
                    />
                </div>
            </Card>

            <Card title="Klasifikasi & Satuan" className="h-full">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <SearchableSelect
                                label="Kategori Barang"
                                required
                                value={data.categoryId}
                                onChange={(val) => onChange('categoryId', val)}
                                placeholder="Pilih Kategori..."
                                options={categories.length > 0 ? categories.map(c => ({ label: c.name, value: c.id })) : []}
                            />
                        </div>

                        <div>
                            <SearchableSelect
                                label="Satuan"
                                required
                                value={data.unit}
                                onChange={(val) => onChange('unit', val)}
                                placeholder="Pilih Satuan..."
                                options={units.length > 0 ? units.map(u => ({ label: u.name, value: u.name })) : [
                                    { label: 'PCS', value: 'PCS' },
                                    { label: 'UNIT', value: 'UNIT' },
                                    { label: 'KG', value: 'KG' },
                                    { label: 'MTR', value: 'MTR' }
                                ]}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Merek Barang</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full px-3 h-[38px] border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Pilih Merek..."
                                value={data.brand || ''}
                                onChange={(e) => onChange('brand', e.target.value)}
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Removed 'Aktifkan No. Seri/Produksi' field as requested */}
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// TAB: PENJUALAN / PEMBELIAN
// ============================================================================
function TabPenjualanPembelian({ data, onChange }: { data: any, onChange: (field: string, value: any) => void }) {
    // Helper for numeric inputs with auto-clear '0'
    const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (e.target.value === '0') {
            e.target.value = '';
        }
    };

    const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
        if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
            onChange(field, 0);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Informasi Penjualan" className="h-full">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Default Diskon (%)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={data.defaultDiskon === 0 ? '' : data.defaultDiskon}
                                onChange={e => onChange('defaultDiskon', parseFloat(e.target.value) || 0)}
                                onFocus={(e) => { if (data.defaultDiskon === 0) e.target.value = ''; }}
                                onBlur={(e) => handleNumberBlur(e, 'defaultDiskon')}
                                className="w-24 px-3 h-[38px] border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                            />
                            <span className="text-sm text-warmgray-500">/ Semua Satuan</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Def. Hrg. Jual Satuan
                        </label>
                        <input
                            type="number"
                            value={data.sellPrice === 0 ? '' : data.sellPrice}
                            onChange={(e) => onChange('sellPrice', Number(e.target.value))}
                            onFocus={(e) => { if (data.sellPrice === 0) e.target.value = ''; }}
                            onBlur={(e) => handleNumberBlur(e, 'sellPrice')}
                            className="w-full px-3 h-[38px] border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                        />
                    </div>
                </div>
            </Card>

            <Card title="Informasi Pembelian" className="h-full">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Harga Beli
                        </label>
                        <input
                            type="number"
                            value={data.purchasePrice === 0 ? '' : data.purchasePrice}
                            onChange={(e) => onChange('purchasePrice', Number(e.target.value))}
                            onFocus={(e) => { if (data.purchasePrice === 0) e.target.value = ''; }}
                            onBlur={(e) => handleNumberBlur(e, 'purchasePrice')}
                            className="w-full px-3 h-[38px] border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// TAB: STOK
// ============================================================================
function TabStok({ data, onChange, warehouses = [], units = [], isEdit = false }: { data: any, onChange: (field: string, value: any) => void, warehouses?: any[], units?: any[], isEdit?: boolean }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStockIndex, setEditingStockIndex] = useState<number | null>(null);

    const handleAddStock = (stockData: any) => {
        if (editingStockIndex !== null) {
            // Update existing
            const newStocks = [...(data.openingStocks || [])];
            newStocks[editingStockIndex] = stockData;
            onChange('openingStocks', newStocks);
        } else {
            // Add new
            const newStocks = [...(data.openingStocks || []), stockData];
            onChange('openingStocks', newStocks);
        }
        setIsModalOpen(false);
        setEditingStockIndex(null);
    };

    const handleDeleteStock = async () => {
        if (editingStockIndex !== null) {
            // Hide modal temporarily so alert is fully visible and accessible
            setIsModalOpen(false);

            const result = await confirmAction(
                'Hapus Stok Awal',
                'Apakah Anda yakin ingin menghapus data stok ini?',
                'Ya, Hapus'
            );

            if (result.isConfirmed) {
                // If it's an existing record (has ID), track it for deletion on Save
                const stockToDelete = data.openingStocks[editingStockIndex];
                if (stockToDelete && stockToDelete.id) {
                    const currentDeleted = data.deletedStockIds || [];
                    onChange('deletedStockIds', [...currentDeleted, stockToDelete.id]);
                }

                const newStocks = [...(data.openingStocks || [])];
                newStocks.splice(editingStockIndex, 1);
                onChange('openingStocks', newStocks);
                // Modal stays closed
                setEditingStockIndex(null);
            } else {
                // User canceled, modal reappears
                setIsModalOpen(true);
            }
        }
    };

    const handleRowClick = (index: number) => {
        // Allow editing in both Create and Edit modes
        setEditingStockIndex(index);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingStockIndex(null);
        setIsModalOpen(true);
    };

    const totalQty = (data.openingStocks || []).reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
    const totalCost = (data.openingStocks || []).reduce((sum: number, item: any) => sum + Number(item.totalCost), 0);
    const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

    return (
        <div className="space-y-8 w-full">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm flex flex-col">
                    <span className="text-sm font-medium text-warmgray-500 mb-1">Total Kuantitas</span>
                    <span className="text-2xl font-bold text-warmgray-900">{totalQty}</span>
                </div>
                <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm flex flex-col">
                    <span className="text-sm font-medium text-warmgray-500 mb-1">Nilai Rata-rata</span>
                    <span className="text-2xl font-bold text-warmgray-900">{formatCurrency(avgCost)}</span>
                </div>
                <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm flex flex-col">
                    <span className="text-sm font-medium text-warmgray-500 mb-1">Total Nilai Persediaan</span>
                    <span className="text-2xl font-bold text-primary-600">{formatCurrency(totalCost)}</span>
                </div>
            </div>

            <Card title="Stok Awal" className="w-full" headerAction={
                // Show Add button in both Create and Edit modes as requested
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Saldo Awal</span>
                </button>
            }>
                <div className="overflow-x-auto -mx-6 -mb-6 -mt-4">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white uppercase bg-warmgray-800 border-b border-warmgray-700">
                            <tr>
                                <th className="px-6 py-3 font-semibold tracking-wider">Tanggal</th>
                                <th className="px-6 py-3 font-semibold tracking-wider">Gudang</th>
                                <th className="px-6 py-3 font-semibold tracking-wider text-right">Kuantitas</th>
                                <th className="px-6 py-3 font-semibold tracking-wider">Satuan</th>
                                <th className="px-6 py-3 font-semibold tracking-wider text-right">Biaya Satuan</th>
                                <th className="px-6 py-3 font-semibold tracking-wider text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {(!data.openingStocks || data.openingStocks.length === 0) ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-warmgray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <p>Belum ada data stok awal</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.openingStocks.map((stock: any, idx: number) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-surface-50 cursor-pointer transition-colors"
                                        onClick={() => handleRowClick(idx)}
                                    >
                                        <td className="px-6 py-4">{stock.date}</td>
                                        <td className="px-6 py-4">
                                            {stock.warehouseName || warehouses.find((w: any) => w.id === stock.warehouseId)?.name || stock.warehouseId}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{stock.quantity}</td>
                                        <td className="px-6 py-4">{stock.unit}</td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(stock.costPerUnit)}</td>
                                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(Number(stock.quantity) * Number(stock.costPerUnit))}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <StockModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingStockIndex(null);
                }}
                onSave={handleAddStock}
                warehouses={warehouses}
                units={units}
                onDelete={editingStockIndex !== null ? handleDeleteStock : undefined}
                initialData={editingStockIndex !== null ? data.openingStocks[editingStockIndex] : undefined}
            />
        </div>
    );
}

// ============================================================================
// TAB: AKUN
// ============================================================================
const ACCOUNT_MAPPING: any = {
    persediaan: 'INVENTORY',
    penjualan: 'SALES',
    returPenjualan: 'SALES_RETURN',
    diskonPenjualan: 'SALES_DISCOUNT',
    barangTerkirim: 'GOODS_SHIPPED',
    bebanPokokPenjualan: 'COGS',
    returPembelian: 'PURCHASE_RETURN',
    pembelianBelumTertagih: 'PURCHASE_ACCRUAL'
};

function TabAkun({ data, onChange, accountList = [] }: { data: any, onChange: (field: string, value: any) => void, accountList?: any[] }) {

    // Helper to format accounts for Select
    const accountOptions = accountList.map(acc => ({
        label: `[${acc.code}] ${acc.name}`,
        value: acc.id
    }));

    const accountFields = [
        { id: 'persediaan', label: 'Persediaan' },
        { id: 'penjualan', label: 'Penjualan' },
        { id: 'returPenjualan', label: 'Retur Penjualan' },
        { id: 'diskonPenjualan', label: 'Diskon Penjualan' },
        { id: 'barangTerkirim', label: 'Barang Terkirim' },
        { id: 'bebanPokokPenjualan', label: 'Beban Pokok Penjualan' },
        { id: 'returPembelian', label: 'Retur Pembelian' },
        { id: 'pembelianBelumTertagih', label: 'Pembelian Belum Tertagih' },
    ];

    const handleAccountChange = (fieldId: string, accountId: any) => {
        // Update nested accounts state
        const updatedAccounts = {
            ...(data.accounts || {}),
            [fieldId]: accountId
        };
        onChange('accounts', updatedAccounts);
    };

    return (
        <Card title="Akun Perkiraan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accountFields.map(field => (
                    <div key={field.id} className="relative">
                        <SearchableSelect
                            label={field.label}
                            value={data.accounts?.[field.id] || ''}
                            onChange={(val) => handleAccountChange(field.id, val)}
                            options={accountOptions}
                            placeholder="Pilih Akun..."
                        />
                    </div>
                ))}
            </div>
            <div className="mt-6 flex items-start gap-2 bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-700">
                <span className="text-xl">ℹ️</span>
                <p className="text-sm">
                    Akun-akun yang dapat dipilih sesuai dengan akun-akun yang dimasukkan pada formulir Preferensi bagian akun default barang
                </p>
            </div>
        </Card>
    );
}

// ============================================================================
// TAB: LAIN-LAIN
// ============================================================================
function TabLainLain() {
    return (
        <div>
            <h3 className="text-base font-semibold text-primary-600 mb-4">Informasi Lain-Lain</h3>
            <p className="text-warmgray-500">Konten tambahan dapat ditambahkan di sini.</p>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function FilterButton({ label, value, onClick }: { label: string, value: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-surface-300 rounded-md text-xs hover:bg-surface-200 transition-colors whitespace-nowrap"
        >
            <span className="text-warmgray-500">{label}:</span>
            <span className="font-semibold text-warmgray-700">{value}</span>
            <ChevronDown className="h-3 w-3 text-warmgray-400" />
        </button>
    );
}

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
