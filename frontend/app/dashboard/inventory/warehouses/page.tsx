'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Plus,
    RefreshCw,
    Pencil,
    Trash2,
    Save,
    Package,
    ArrowLeft,
    X,
    Folder,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { confirmAction, showSuccess, showError } from '@/lib/swal';
import { useTabContext } from '@/contexts/TabContext';

export default function InventoryWarehousesPage() {
    const {
        openDataTab,
        closeDataTab,
        getActiveDataTab,
        updateDataTabData,
        markDataTabDirty,
    } = useTabContext();
    const featureId = '/dashboard/inventory/warehouses';

    // Data State
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Derived state from TabContext
    const activeDataTab = getActiveDataTab();
    const activeTabId = activeDataTab?.id;

    const isListView = !activeTabId || activeTabId === `${featureId}-list`;

    // Determine if we are in a form view (create or edit)
    const isFormView = activeTabId && (activeTabId === `${featureId}-new` || activeTabId.startsWith(`${featureId}-edit-`));

    // Extract ID for edit if applicable
    const editId = activeTabId?.startsWith(`${featureId}-edit-`) ? activeTabId.replace(`${featureId}-edit-`, '') : null;
    const editingWarehouse = editId ? warehouses.find(w => w.id === editId) : null;

    const fetchWarehouses = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (searchQuery) params.search = searchQuery;

            const response = await api.get('/warehouses', { params });
            // Robust data handling
            const data = response.data.data || response.data || [];
            if (Array.isArray(data)) {
                setWarehouses(data);
            } else {
                setWarehouses([]);
                console.warn('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Failed to fetch warehouses:', error);
            setWarehouses([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Initial fetch
    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    const handleNewClick = () => {
        openDataTab(featureId, {
            id: `${featureId}-new`,
            title: 'Gudang Baru',
            href: featureId
        });
    };

    const handleRowClick = (warehouse: any) => {
        openDataTab(featureId, {
            id: `${featureId}-edit-${warehouse.id}`,
            title: warehouse.name,
            href: featureId
        });
    };

    const handleCancelForm = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchWarehouses();
    };

    const handleSaveSuccess = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchWarehouses();
    };

    const handleDeleteSuccess = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchWarehouses();
    };


    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden">
            {isListView && (
                <ListView
                    warehouses={warehouses}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRefresh={fetchWarehouses}
                    onNewClick={handleNewClick}
                    onRowClick={handleRowClick}
                />
            )}

            {isFormView && (
                <FormView
                    key={activeTabId} // Force remount on tab change
                    tabId={activeTabId}
                    featureId={featureId}
                    initialData={editingWarehouse}
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

// --- Sub-components ---

function ListView({
    warehouses,
    loading,
    searchQuery,
    onSearchChange,
    onRefresh,
    onNewClick,
    onRowClick
}: any) {
    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                <div className="flex items-center gap-1">
                    <button
                        onClick={onNewClick}
                        className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                        title="Tambah Gudang"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onRefresh}
                        className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded transition-colors bg-white"
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center border border-surface-300 rounded overflow-hidden bg-white">
                        <span className="px-3 py-1.5 text-sm text-warmgray-500 bg-white">Cari...</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-48 px-2 py-1.5 text-sm bg-white border-l border-surface-200 focus:outline-none focus:ring-0 placeholder:text-warmgray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto relative">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Kode</th>
                            <th className="px-4 py-3 font-semibold">Nama Gudang</th>
                            <th className="px-4 py-3 font-semibold">Alamat</th>
                            <th className="px-4 py-3 font-semibold">Kota</th>
                            <th className="px-4 py-3 font-semibold text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-warmgray-500">Memuat data...</td>
                            </tr>
                        ) : warehouses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-warmgray-500">
                                    <MapPin className="h-12 w-12 mx-auto mb-3 text-warmgray-300" />
                                    <p>Tidak ada data gudang</p>
                                </td>
                            </tr>
                        ) : (
                            warehouses.map((warehouse: any, index: number) => (
                                <tr
                                    key={warehouse.id}
                                    onClick={() => onRowClick(warehouse)}
                                    className={cn(
                                        "hover:bg-primary-50 transition-colors cursor-pointer",
                                        index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                    )}
                                >
                                    <td className="px-4 py-2 font-mono text-primary-700">{warehouse.code}</td>
                                    <td className="px-4 py-2 font-medium text-warmgray-900">{warehouse.name}</td>
                                    <td className="px-4 py-2 text-warmgray-600 truncate max-w-xs">{warehouse.address || '-'}</td>
                                    <td className="px-4 py-2 text-warmgray-600">{warehouse.city || '-'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <span className={cn(
                                            "px-2 py-0.5 text-xs rounded-full inline-block",
                                            warehouse.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {warehouse.isActive ? 'Aktif' : 'Non Aktif'}
                                        </span>
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

// Unified Form View for Create and Edit
function FormView({
    tabId,
    featureId,
    initialData,
    savedData,
    updateDataTabData,
    markDataTabDirty,
    onCancel,
    onSuccess,
    onDeleteSuccess
}: any) {
    const isEdit = !!initialData;

    // Initialize form data
    const [formData, setFormData] = useState({
        code: savedData?.code ?? (initialData?.code || ''),
        name: savedData?.name ?? (initialData?.name || ''),
        address: savedData?.address ?? (initialData?.address || ''),
        city: savedData?.city ?? (initialData?.city || ''),
        isActive: savedData?.isActive ?? (initialData ? initialData.isActive : true)
    });

    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Sync formData to TabContext whenever it changes
    useEffect(() => {
        if (tabId && featureId && updateDataTabData) {
            updateDataTabData(featureId, tabId, formData);

            const isDirty =
                formData.code !== (initialData?.code || '') ||
                formData.name !== (initialData?.name || '') ||
                formData.address !== (initialData?.address || '') ||
                formData.city !== (initialData?.city || '') ||
                formData.isActive !== (initialData ? initialData.isActive : true);

            markDataTabDirty(featureId, tabId, isDirty);
        }
    }, [formData, tabId, featureId, updateDataTabData, markDataTabDirty, initialData]);


    const handleSubmit = async () => {
        if (!formData.name) {
            showError('Validasi Gagal', 'Nama Gudang wajib diisi');
            return;
        }
        if (!formData.code) {
            showError('Validasi Gagal', 'Kode Gudang wajib diisi');
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit) {
                await api.put(`/warehouses/${initialData.id}`, formData);
            } else {
                await api.post('/warehouses', formData);
            }
            await showSuccess('Berhasil', 'Data gudang berhasil disimpan');
            onSuccess();
        } catch (error: any) {
            console.error('Error saving warehouse:', error);
            showError('Gagal Menyimpan', error.response?.data?.error || 'Gagal menyimpan gudang');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const result = await confirmAction(
            'Hapus Gudang?',
            'Apakah Anda yakin ingin menghapus gudang ini? Data yang dihapus tidak dapat dikembalikan.'
        );

        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            await api.delete(`/warehouses/${initialData.id}`);
            await showSuccess('Berhasil', 'Gudang berhasil dihapus');
            onDeleteSuccess();
        } catch (error: any) {
            console.error('Error deleting warehouse:', error);
            showError('Gagal Menghapus', error.response?.data?.error || 'Gagal menghapus gudang');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar for Form View */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                <div className="flex items-center gap-2">
                    <button onClick={onCancel} className="p-1 hover:bg-surface-200 rounded">
                        <ArrowLeft className="h-5 w-5 text-warmgray-600" />
                    </button>
                    <span className="font-semibold text-warmgray-800">
                        {isEdit ? 'Edit Gudang' : 'Tambah Gudang Baru'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-sm text-warmgray-600 hover:text-warmgray-800 hover:bg-surface-100 rounded border border-transparent"
                    >
                        Batal
                    </button>

                    {isEdit && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting || submitting}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded shadow-sm disabled:opacity-50"
                        >
                            {deleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Hapus
                        </button>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || deleting}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded shadow-sm disabled:opacity-50"
                    >
                        {submitting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Simpan
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="p-6 max-w-2xl mx-auto w-full overflow-auto">
                <div className="bg-white p-6 rounded-lg border border-surface-200 shadow-sm space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-warmgray-700 mb-1">
                                Kode Gudang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className={cn(
                                    "w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm",
                                    isEdit && "bg-surface-100 text-warmgray-500 cursor-not-allowed"
                                )}
                                placeholder="Contoh: GD-001"
                                autoFocus={!isEdit}
                                disabled={isEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-warmgray-700 mb-1">
                                Nama Gudang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                                placeholder="Nama Gudang"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-warmgray-700 mb-1">
                                Alamat
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm h-24 resize-none"
                                placeholder="Alamat lengkap gudang"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-warmgray-700 mb-1">
                                Kota
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                                placeholder="Contoh: Jakarta Selatan"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="rounded border-warmgray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="isActive" className="text-sm text-warmgray-700">Gudang Aktif</label>
                    </div>
                </div>
            </div>
        </div>
    );
}
