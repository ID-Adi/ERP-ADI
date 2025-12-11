'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Plus,
    Search,
    RefreshCw,
    Pencil,
    Trash2,
    Save,
    Package,
    ArrowLeft,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { confirmAction, showSuccess, showError } from '@/lib/swal';
import { useTabContext } from '@/contexts/TabContext';

export default function UnitsView() {
    const {
        openDataTab,
        closeDataTab,
        getActiveDataTab,
        updateDataTabData,
        markDataTabDirty,
        featureTabs
    } = useTabContext();
    const featureId = '/dashboard/inventory/units';

    // Data State
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Derived state from TabContext
    const activeDataTab = getActiveDataTab();
    const activeTabId = activeDataTab?.id;

    const isListView = !activeTabId || activeTabId === `${featureId}-list`;

    // Determine if we are in a form view (create or edit)
    // We'll use a specific ID pattern: `${featureId}-new` for create, `${featureId}-edit-${id}` for edit
    const isFormView = activeTabId && (activeTabId === `${featureId}-new` || activeTabId.startsWith(`${featureId}-edit-`));

    // Extract ID for edit if applicable
    const editId = activeTabId?.startsWith(`${featureId}-edit-`) ? activeTabId.replace(`${featureId}-edit-`, '') : null;
    const editingUnit = editId ? units.find(u => u.id === editId) : null;

    const fetchUnits = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (searchQuery) params.search = searchQuery;

            const response = await api.get('/units', params);
            // Robust data handling
            const data = response.data.data || response.data || [];
            if (Array.isArray(data)) {
                setUnits(data);
            } else {
                setUnits([]);
                console.warn('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Failed to fetch units:', error);
            setUnits([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Initial fetch
    useEffect(() => {
        // Only fetch if this feature is active or initial load
        fetchUnits();
    }, [fetchUnits]);

    const handleNewClick = () => {
        openDataTab(featureId, {
            id: `${featureId}-new`,
            title: 'Data Baru',
            href: featureId
        });
    };

    const handleRowClick = (unit: any) => {
        openDataTab(featureId, {
            id: `${featureId}-edit-${unit.id}`,
            title: `Edit: ${unit.name}`,
            href: featureId
        });
    };

    const handleCancelForm = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchUnits(); // Refresh list just in case
    };

    const handleSaveSuccess = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchUnits();
    };

    const handleDeleteSuccess = () => {
        if (activeTabId) {
            closeDataTab(featureId, activeTabId);
        }
        fetchUnits();
    };


    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden">
            {isListView && (
                <ListView
                    units={units}
                    loading={loading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRefresh={fetchUnits}
                    onNewClick={handleNewClick}
                    onRowClick={handleRowClick}
                />
            )}

            {isFormView && (
                <FormView
                    key={activeTabId} // Force remount on tab change
                    tabId={activeTabId}
                    featureId={featureId}
                    initialData={editingUnit}
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
    units,
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
                        title="Tambah Satuan"
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
                            <th className="px-4 py-3 font-semibold">Nama Satuan</th>
                            <th className="px-4 py-3 font-semibold">Keterangan</th>
                            <th className="px-4 py-3 font-semibold text-right">Status</th>
                            {/* Action column removed */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-warmgray-500">Memuat data...</td>
                            </tr>
                        ) : units.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-12 text-center text-warmgray-500">
                                    <Package className="h-12 w-12 mx-auto mb-3 text-warmgray-300" />
                                    <p>Tidak ada data satuan</p>
                                </td>
                            </tr>
                        ) : (
                            units.map((unit: any, index: number) => (
                                <tr
                                    key={unit.id}
                                    onClick={() => onRowClick(unit)}
                                    className={cn(
                                        "hover:bg-primary-50 transition-colors cursor-pointer", // Added cursor-pointer
                                        index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                    )}
                                >
                                    <td className="px-4 py-2 font-medium text-warmgray-900">{unit.name}</td>
                                    <td className="px-4 py-2 text-warmgray-600">{unit.description || '-'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <span className={cn(
                                            "px-2 py-0.5 text-xs rounded-full inline-block",
                                            unit.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {unit.isActive ? 'Aktif' : 'Non Aktif'}
                                        </span>
                                    </td>
                                    {/* Action cell removed */}
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

    // Initialize form data from savedData (if available) or initialData (if edit) or defaults
    const [formData, setFormData] = useState({
        name: savedData?.name ?? (initialData?.name || ''),
        description: savedData?.description ?? (initialData?.description || ''),
        isActive: savedData?.isActive ?? (initialData ? initialData.isActive : true)
    });

    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Sync formData to TabContext whenever it changes
    useEffect(() => {
        if (tabId && featureId && updateDataTabData) {
            updateDataTabData(featureId, tabId, formData);

            // Determine if dirty
            // Simple check: if not empty or different from initial (but strictly, any change from "clean" state)
            // For now, let's just mark dirty if any field has value (for new) or differs (for edit)
            // Or simpler: just mark dirty always on change, relying on the fact that if we are typing, it's dirty.
            // But 'tab.isDirty' is used to show indicator.

            // Let's refine dirty check:
            const isDirty =
                formData.name !== (initialData?.name || '') ||
                formData.description !== (initialData?.description || '') ||
                formData.isActive !== (initialData ? initialData.isActive : true);

            markDataTabDirty(featureId, tabId, isDirty);
        }
    }, [formData, tabId, featureId, updateDataTabData, markDataTabDirty, initialData]);


    const handleSubmit = async () => {
        if (!formData.name) {
            showError('Validasi Gagal', 'Nama Satuan wajib diisi');
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit) {
                await api.put(`/units/${initialData.id}`, formData);
            } else {
                await api.post('/units', formData);
            }
            await showSuccess('Berhasil', 'Data satuan berhasil disimpan');
            onSuccess();
        } catch (error: any) {
            console.error('Error saving unit:', error);
            showError('Gagal Menyimpan', error.response?.data?.error || 'Gagal menyimpan satuan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const result = await confirmAction(
            'Hapus Satuan?',
            'Apakah Anda yakin ingin menghapus satuan ini? Data yang dihapus tidak dapat dikembalikan.'
        );

        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            await api.delete(`/units/${initialData.id}`);
            await showSuccess('Berhasil', 'Satuan berhasil dihapus');
            onDeleteSuccess();
        } catch (error: any) {
            console.error('Error deleting unit:', error);
            showError('Gagal Menghapus', error.response?.data?.error || 'Gagal menghapus satuan');
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
                        {isEdit ? 'Edit Satuan' : 'Tambah Satuan Baru'}
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
                    <div>
                        <label className="block text-sm font-medium text-warmgray-700 mb-1">
                            Nama Satuan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                            placeholder="Contoh: Pcs, Box, Kg"
                            autoFocus
                        />
                        <p className="mt-1 text-xs text-warmgray-400">Nama satuan yang unik untuk produk.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-warmgray-700 mb-1">
                            Keterangan
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm h-32 resize-none"
                            placeholder="Deskripsi tambahan (opsional)"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="rounded border-warmgray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="isActive" className="text-sm text-warmgray-700">Aktif</label>
                    </div>
                </div>
            </div>
        </div>
    );
}
