'use client';

import { useState, useCallback, useEffect } from 'react';
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
    FileDown,
    Trash,
    Check
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import SearchableSelect from '@/components/ui/SearchableSelect';

import api from '@/lib/api';

export default function InventoryItemsPage() {
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
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: 'Semua',
        category: 'Semua',
        type: 'Semua', // Jenis Barang
        brand: 'Semua'
    });

    // Derived state from TabContext
    const activeDataTab = getActiveDataTab();
    const activeTabId = activeDataTab?.id;

    const isListView = !activeTabId || activeTabId === `${featureId}-list`;
    const isFormView = activeTabId && (activeTabId === `${featureId}-new` || activeTabId.startsWith(`${featureId}-edit-`));

    // Extract ID for edit if applicable
    const editId = activeTabId?.startsWith(`${featureId}-edit-`) ? activeTabId.replace(`${featureId}-edit-`, '') : null;
    const editingItem = editId ? items.find(i => i.id === editId) : null;

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                limit: 50, // Initial limit
            };

            if (searchQuery) params.search = searchQuery;
            if (filters.status !== 'Semua') params.status = filters.status;
            if (filters.category !== 'Semua') params.category = filters.category;
            if (filters.type !== 'Semua') params.type = filters.type;
            if (filters.brand !== 'Semua') params.brand = filters.brand;

            const response = await api.get('/items', params);
            setItems(response.data.data ? response.data.data : response.data); // Handle {data: [], meta: ...} or []
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    // Ensure List tab exists and is active on mount if no tab is active
    useEffect(() => {
        // Find existing list tab
        const currentFeature = featureTabs.find(f => f.id === featureId);
        if (!currentFeature) return;

        // Only fetch if we have NO items yet (first load)
        if (items.length === 0 && loading) {
            fetchItems();
        }
    }, [fetchItems, featureTabs, items.length, loading]);

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

    const handleCancelForm = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        // We do NOT need to fetchItems() here if we want to preserve state exactly.
        // But if user saved, we might want to refresh list.
        // For now, let's assume we want to refresh ONLY if saved.
        // Since handleCancelForm is used for both 'Cancel' and 'Save Success', 
        // we might need to distinguish. 
        // Given user asked for "No Refresh", keeping existing data is safer.
        // If we want to see new item, we should simple prepend/update list locally or just fetch silenty.
        // For now: Fetch updates silently or just leave it.
        // Let's re-fetch to show updates, but hopefully scrolling stays if we use CSS hiding.
        fetchItems();
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden relative">

            {/* FORM VIEW OVERLAY */}
            <div className={cn(
                "absolute inset-0 z-20 bg-white flex flex-col transition-opacity duration-200",
                isFormView ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none hidden"
            )}>
                {isFormView && (
                    <ItemForm
                        key={activeTabId || 'form'}
                        initialData={editingItem}
                        onCancel={handleCancelForm}
                    />
                )}
            </div>

            {/* LIST VIEW CONTENT */}
            {/* Always rendered, just hidden if form is active? 
                Actually ListView has its own layout (filters + toolbar + table).
                If we wrap it all in a div and hide it, it works.
            */}
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
        status: string;
        category: string;
        type: string;
        brand: string;
    };
    onFilterChange: (filters: any) => void;
}

function ListView({ items, searchQuery, onSearchChange, loading, onRowClick, onNewClick, filters, onFilterChange }: ListViewProps) {
    return (
        <>
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
                        className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded transition-colors bg-white"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>

                {/* Right: Actions & Search */}
                <div className="flex items-center gap-2">
                    {/* Action Buttons Group */}
                    <div className="flex items-center border border-surface-300 rounded bg-white">
                        <Tooltip text="Download">
                            <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 rounded-l transition-colors">
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

                    {/* Search Icon */}
                    <button className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-500 rounded bg-white">
                        <Search className="h-4 w-4" />
                    </button>

                    {/* Count */}
                    <span className="text-sm text-warmgray-600 font-medium min-w-[40px] text-right">{items.length.toLocaleString()}</span>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto relative">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                        <tr>
                            <Th>Nama Barang</Th>
                            <Th>Kode Barang</Th>
                            <Th>Jenis Barang</Th>
                            <Th>Satuan</Th>
                            <Th>Kts (Gdng Pengguna)</Th>
                            <Th>Stok dapat dijual</Th>
                            <Th>:Non Aktif</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200">
                        {items.map((item, index) => (
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
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-warmgray-500">
                                    <Package className="h-12 w-12 mx-auto mb-3 text-warmgray-300" />
                                    <p>Tidak ada data barang</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

// ============================================================================
// FORM VIEW (Create & Edit)
// ============================================================================
// Imports are already at the top of the file

function ItemForm({ initialData, onCancel }: { initialData?: any, onCancel: () => void }) {
    const isEdit = !!initialData;
    const { getActiveDataTab, updateDataTabData, activeFeatureTabId } = useTabContext();
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
        aktifkanSeri: initialData?.aktifkanSeri || false,
        kategoriProduk: initialData?.kategoriProduk || '',
        idHppPky: initialData?.idHppPky || '',
    };

    const [formData, setFormData] = useState({
        ...defaultState,
        ...(cachedData as any || {})
    });

    const handleChange = (field: string, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);

        // Persist to TabContext
        if (tabId) {
            updateDataTabData(featureId, tabId, newData);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.code) {
            alert('Nama Barang dan Kode Barang wajib diisi');
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit) {
                await api.put(`/items/${initialData.id}`, formData);
                alert('Barang berhasil diperbarui');
            } else {
                await api.post('/items', formData);
                alert('Barang berhasil disimpan');
            }
            onCancel(); // Back to list and refresh
        } catch (error: any) {
            console.error('Error saving item:', error);
            alert(error.response?.data?.error || 'Gagal menyimpan barang');
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [unitsRes, categoriesRes] = await Promise.all([
                    api.get('/units'),
                    api.get('/categories')
                ]);

                const unitsData = unitsRes.data.data || unitsRes.data;
                const categoriesData = categoriesRes.data.data || categoriesRes.data;

                setUnits(Array.isArray(unitsData) ? unitsData : []);
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col h-full bg-surface-50">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-warmgray-800 text-white border-b border-warmgray-900 flex-none shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="p-1 hover:bg-warmgray-700 rounded-full transition-colors text-warmgray-300">
                        <X className="h-5 w-5" />
                    </button>
                    <span className="text-lg font-semibold tracking-wide">
                        {isEdit ? 'Edit Data Barang' : 'Data Baru'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {isEdit && (
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
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-md shadow-lg font-medium transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed",
                                submitting && "opacity-75 cursor-wait"
                            )}
                        >
                            <Trash className="h-4 w-4" />
                            Hapus
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md shadow-lg font-medium transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed",
                            submitting && "opacity-75 cursor-wait"
                        )}
                    >
                        <Save className="h-4 w-4" />
                        {submitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>

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
                    {subTab === 'umum' && <TabUmum data={formData} onChange={handleChange} units={units} categories={categories} isEdit={isEdit} />}
                    {subTab === 'penjualan-pembelian' && <TabPenjualanPembelian data={formData} onChange={handleChange} />}
                    {subTab === 'stok' && <TabStok data={formData} onChange={handleChange} />}
                    {subTab === 'akun' && <TabAkun />}
                    {subTab === 'lain-lain' && <TabLainLain />}
                </div>
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
function TabUmum({ data, onChange, units = [], categories = [], isEdit = false }: { data: any, onChange: (field: string, value: any) => void, units?: any[], categories?: any[], isEdit?: boolean }) {
    const [autoCode, setAutoCode] = useState(!data.code);

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
                    <Input
                        label="Nama Barang"
                        required
                        value={data.name}
                        onChange={(e) => onChange('name', e.target.value)}
                        placeholder="Contoh: ACP Seven..."
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kode Barang <span className="text-danger-600">*</span>
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isEdit) {
                                        const newState = !autoCode;
                                        setAutoCode(newState);
                                        if (newState) onChange('code', ''); // Clear code if auto
                                    }
                                }}
                                disabled={isEdit}
                                className={cn(
                                    "flex items-center gap-2 px-3 border rounded-lg transition-colors h-[42px]",
                                    autoCode ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-white border-gray-300 text-gray-600",
                                    isEdit && "opacity-50 cursor-not-allowed bg-gray-100"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center",
                                    autoCode ? "bg-primary-600 border-primary-600" : "border-gray-400"
                                )}>
                                    {autoCode && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-medium">Otomatis</span>
                            </button>

                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => {
                                    onChange('code', e.target.value);
                                    if (e.target.value) setAutoCode(false); // Disable auto if user types
                                }}
                                className={cn(
                                    "form-input flex-1",
                                    (isEdit || autoCode) && "bg-surface-100 text-warmgray-500 cursor-not-allowed"
                                )}
                                placeholder={autoCode ? "Kode akan digenerate otomatis..." : "Masukkan kode barang"}
                                disabled={isEdit || autoCode}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Barang <span className="text-warmgray-400 text-xs ml-1">ⓘ</span>
                        </label>
                        <select
                            value={data.type}
                            onChange={(e) => onChange('type', e.target.value)}
                            className="form-select w-full"
                        >
                            <option value="Persediaan">Persediaan</option>
                            <option value="Jasa">Jasa</option>
                            <option value="Non-Persediaan">Non-Persediaan</option>
                        </select>
                    </div>
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
                                className="form-input w-full pr-8"
                                placeholder="Pilih Merek..."
                                value={data.brand || ''}
                                onChange={(e) => onChange('brand', e.target.value)}
                            />
                            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="rounded border-warmgray-300 text-primary-600 shadow-sm focus:ring-primary-500"
                                checked={data.aktifkanSeri || false}
                                onChange={(e) => onChange('aktifkanSeri', e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-warmgray-700">Aktifkan No. Seri/Produksi</span>
                        </label>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// TAB: PENJUALAN / PEMBELIAN
// ============================================================================
function TabPenjualanPembelian({ data, onChange }: { data: any, onChange: (field: string, value: any) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Informasi Penjualan" className="h-full">
                <div className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Default Diskon (%)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={data.defaultDiskon || ''}
                                onChange={e => onChange('defaultDiskon', e.target.value)}
                                className="form-input w-24"
                            />
                            <span className="text-sm text-warmgray-500">/ Semua Satuan</span>
                        </div>
                    </div>

                    <Input
                        label="Def. Hrg. Jual Satuan"
                        type="number"
                        value={data.sellPrice}
                        onChange={(e) => onChange('sellPrice', Number(e.target.value))}
                    />
                </div>
            </Card>

            <Card title="Informasi Pembelian" className="h-full">
                <div className="space-y-4">
                    <Input
                        label="Harga Beli"
                        type="number"
                        value={data.purchasePrice}
                        onChange={(e) => onChange('purchasePrice', Number(e.target.value))}
                    />
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// TAB: STOK
// ============================================================================
function TabStok({ data, onChange }: { data: any, onChange: (field: string, value: any) => void }) {
    return (
        <div className="max-w-2xl">
            <Card title="Pengaturan Stok">
                <div className="space-y-4">
                    <Input
                        label="Stok Minimum"
                        type="number"
                        value={data.minStock}
                        onChange={(e) => onChange('minStock', Number(e.target.value))}
                    />
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// TAB: AKUN
// ============================================================================
function TabAkun() {
    const accountFields = [
        { id: 'persediaan', label: 'Persediaan', value: '[110401] Persediaan' },
        { id: 'penjualan', label: 'Penjualan', value: '[400001] Penjualan' },
        { id: 'returPenjualan', label: 'Retur Penjualan', value: '[400003] Retur Penjualan' },
        { id: 'diskonPenjualan', label: 'Diskon Penjualan', value: '[400004] Diskon Penjualan' },
        { id: 'barangTerkirim', label: 'Barang Terkirim', value: '[110402] Persediaan Terkirim' },
        { id: 'bebanPokokPenjualan', label: 'Beban Pokok Penjualan', value: '[5101] Beban Pokok Penjualan' },
        { id: 'returPembelian', label: 'Retur Pembelian', value: '[110401] Persediaan' },
        { id: 'pembelianBelumTertagih', label: 'Pembelian Belum Tertagih', value: '[210203] Hutang Pembelian Belum Ditagih' },
    ];

    return (
        <Card title="Akun Perkiraan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accountFields.map(field => (
                    <div key={field.id} className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="form-input w-full pr-8"
                                value={field.value}
                                readOnly
                            />
                            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                        </div>
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

function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <th scope="col" className={cn("px-4 py-2.5 font-semibold whitespace-nowrap cursor-pointer hover:bg-warmgray-700 transition-colors", className)}>
            <div className="flex items-center gap-1">
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
