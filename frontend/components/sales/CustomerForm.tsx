'use client';

import { useState, useEffect } from 'react';
import {
    Save,
    Trash2,
    RefreshCw,
    ArrowLeft,
    MapPin,
    CreditCard,
    FileText,
    User,
    Book
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { confirmAction, showSuccess, showError } from '@/lib/swal';

interface CustomerFormProps {
    tabId: string;
    featureId: string;
    initialData?: any;
    savedData?: any;
    updateDataTabData: (featureId: string, tabId: string, data: any) => void;
    markDataTabDirty: (featureId: string, tabId: string, isDirty: boolean) => void;
    onCancel: () => void;
    onSuccess: () => void;
    onDeleteSuccess: () => void;
}

export default function CustomerForm({
    tabId,
    featureId,
    initialData,
    savedData,
    updateDataTabData,
    markDataTabDirty,
    onCancel,
    onSuccess,
    onDeleteSuccess
}: CustomerFormProps) {
    const isEdit = !!initialData;
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [accounts, setAccounts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        // Identity
        code: savedData?.code ?? (initialData?.code || ''),
        name: savedData?.name ?? (initialData?.name || ''),
        category: savedData?.category ?? (initialData?.category || 'Umum'),
        contactPerson: savedData?.contactPerson ?? (initialData?.contactPerson || ''),
        email: savedData?.email ?? (initialData?.email || ''),
        phone: savedData?.phone ?? (initialData?.phone || ''),
        mobile: savedData?.mobile ?? (initialData?.mobile || ''),
        fax: savedData?.fax ?? (initialData?.fax || ''),
        website: savedData?.website ?? (initialData?.website || ''),
        notes: savedData?.notes ?? (initialData?.notes || ''),

        // Billing Address
        billingAddress: savedData?.billingAddress ?? (initialData?.billingAddress || ''),
        billingCity: savedData?.billingCity ?? (initialData?.billingCity || ''),
        billingProvince: savedData?.billingProvince ?? (initialData?.billingProvince || ''),
        billingCountry: savedData?.billingCountry ?? (initialData?.billingCountry || 'Indonesia'),
        billingZipCode: savedData?.billingZipCode ?? (initialData?.billingZipCode || ''),

        // Shipping Address
        shippingAddress: savedData?.shippingAddress ?? (initialData?.shippingAddress || ''),
        shippingCity: savedData?.shippingCity ?? (initialData?.shippingCity || ''),
        shippingProvince: savedData?.shippingProvince ?? (initialData?.shippingProvince || ''),
        shippingCountry: savedData?.shippingCountry ?? (initialData?.shippingCountry || 'Indonesia'),
        shippingZipCode: savedData?.shippingZipCode ?? (initialData?.shippingZipCode || ''),

        // Sales & Settings
        priceCategory: savedData?.priceCategory ?? (initialData?.priceCategory || 'RETAIL'),
        discountCategory: savedData?.discountCategory ?? (initialData?.discountCategory || ''),
        paymentTerms: savedData?.paymentTerms ?? (initialData?.paymentTerms || 0),
        creditLimit: savedData?.creditLimit ?? (initialData?.creditLimit || 0),
        maxReceivableDays: savedData?.maxReceivableDays ?? (initialData?.maxReceivableDays || 0),
        salesperson: savedData?.salesperson ?? (initialData?.salesperson || ''),
        defaultDiscount: savedData?.defaultDiscount ?? (initialData?.defaultDiscount || 0),
        taxIncluded: savedData?.taxIncluded ?? (initialData?.taxIncluded || false),
        isActive: savedData?.isActive ?? (initialData?.isActive ?? true),

        // Tax
        npwp: savedData?.npwp ?? (initialData?.npwp || ''),
        taxName: savedData?.taxName ?? (initialData?.taxName || ''),
        nik: savedData?.nik ?? (initialData?.nik || ''),
        nppkp: savedData?.nppkp ?? (initialData?.nppkp || ''),
        taxAddress: savedData?.taxAddress ?? (initialData?.taxAddress || ''),

        // Accounts
        receivableAccountId: savedData?.receivableAccountId ?? (initialData?.receivableAccountId || ''),
        downPaymentAccountId: savedData?.downPaymentAccountId ?? (initialData?.downPaymentAccountId || ''),
        salesAccountId: savedData?.salesAccountId ?? (initialData?.salesAccountId || ''),
        cogsAccountId: savedData?.cogsAccountId ?? (initialData?.cogsAccountId || ''),
        salesReturnAccountId: savedData?.salesReturnAccountId ?? (initialData?.salesReturnAccountId || ''),
        goodsDiscountAccountId: savedData?.goodsDiscountAccountId ?? (initialData?.goodsDiscountAccountId || ''),
        salesDiscountAccountId: savedData?.salesDiscountAccountId ?? (initialData?.salesDiscountAccountId || ''),
    });

    // Fetch accounts for dropdowns
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get('/accounts', { params: { limit: 1000 } });
                const data = response.data.data || response.data || [];
                setAccounts(data);
            } catch (err) {
                console.error('Failed to fetch accounts', err);
            }
        };
        fetchAccounts();
    }, []);

    // Sync to TabContext
    useEffect(() => {
        updateDataTabData(featureId, tabId, formData);

        // Simple dirty check logic (can be refined)
        const isClean = !initialData && Object.values(formData).every(v => v === '' || v === 0 || v === false || v === true || v === 'IDR');
        // Better: compare with initial
        markDataTabDirty(featureId, tabId, !isClean);
    }, [formData, tabId, featureId, updateDataTabData, markDataTabDirty, initialData]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            showError('Validasi Gagal', 'Nama Pelanggan wajib diisi');
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit) {
                await api.put(`/customers/${initialData.id}`, formData);
            } else {
                await api.post('/customers', formData);
            }
            await showSuccess('Berhasil', 'Data pelanggan berhasil disimpan');
            onSuccess();
        } catch (error: any) {
            console.error('Error saving customer:', error);
            showError('Gagal Menyimpan', error.response?.data?.error || 'Gagal menyimpan data pelanggan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const result = await confirmAction(
            'Hapus Pelanggan?',
            'Apakah anda yakin ingin menghapus pelanggan ini? Data yang dihapus tidak dapat dikembalikan.'
        );

        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            await api.delete(`/customers/${initialData.id}`);
            await showSuccess('Berhasil', 'Pelanggan berhasil dihapus');
            onDeleteSuccess();
        } catch (error: any) {
            console.error('Error deleting customer:', error);
            showError('Gagal Menghapus', 'Gagal menghapus pelanggan');
        } finally {
            setDeleting(false);
        }
    };

    const renderTabButton = (id: string, label: string, icon: any) => {
        const Icon = icon;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === id
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-warmgray-500 hover:text-warmgray-700 hover:border-warmgray-300"
                )}
            >
                <Icon className="h-4 w-4" />
                {label}
            </button>
        );
    };

    const AccountSelect = ({ label, field, value }: any) => (
        <div>
            <label className="block text-sm font-medium text-warmgray-700 mb-1">{label}</label>
            <select
                value={value || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
                <option value="">-- Pilih Akun --</option>
                {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                <div className="flex items-center gap-2">
                    <button onClick={onCancel} className="p-1 hover:bg-surface-200 rounded text-warmgray-600">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="font-semibold text-warmgray-800">
                        {isEdit ? `Edit: ${initialData.name}` : 'Pelanggan Baru'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onCancel} className="px-3 py-1.5 text-sm text-warmgray-600 hover:bg-surface-100 rounded border border-transparent">
                        Batal
                    </button>
                    {isEdit && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded flex items-center gap-2"
                        >
                            <Trash2 className="h-3 w-3" /> Hapus
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded flex items-center gap-2"
                    >
                        {submitting && <RefreshCw className="h-3 w-3 animate-spin" />}
                        <Save className="h-3 w-3" /> Simpan
                    </button>
                </div>
            </div>

            {/* Tabs Header */}
            <div className="flex px-4 border-b border-surface-200 bg-white sticky top-0 z-10">
                {renderTabButton('general', 'Informasi Umum', User)}
                {renderTabButton('address', 'Alamat', MapPin)}
                {renderTabButton('sales', 'Penjualan', CreditCard)}
                {renderTabButton('tax', 'Pajak', FileText)}
                {renderTabButton('accounts', 'Akun', Book)}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl space-y-6">

                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Kode Pelanggan</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => handleChange('code', e.target.value)}
                                        placeholder="(Otomatis)"
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm bg-surface-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Nama Pelanggan <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleChange('category', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="Umum">Umum</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Grosir">Grosir</option>
                                        <option value="Agen">Agen</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Catatan</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Nama Kontak</label>
                                    <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={(e) => handleChange('contactPerson', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-warmgray-700 mb-1">No. Telp Bisnis</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-warmgray-700 mb-1">Handphone</label>
                                        <input
                                            type="text"
                                            value={formData.mobile}
                                            onChange={(e) => handleChange('mobile', e.target.value)}
                                            className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Website</label>
                                    <input
                                        type="text"
                                        value={formData.website}
                                        onChange={(e) => handleChange('website', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="https://"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mt-4">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => handleChange('isActive', e.target.checked)}
                                            className="rounded border-warmgray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-warmgray-700">Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Address Tab */}
                    {activeTab === 'address' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Billing */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-warmgray-900 border-b pb-2">Alamat Penagihan</h3>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Alamat Lengkap</label>
                                    <textarea
                                        value={formData.billingAddress}
                                        onChange={(e) => handleChange('billingAddress', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-warmgray-700 mb-1">Kota</label>
                                        <input
                                            type="text"
                                            value={formData.billingCity}
                                            onChange={(e) => handleChange('billingCity', e.target.value)}
                                            className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-warmgray-700 mb-1">Kode Pos</label>
                                        <input
                                            type="text"
                                            value={formData.billingZipCode}
                                            onChange={(e) => handleChange('billingZipCode', e.target.value)}
                                            className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Provinsi</label>
                                    <input
                                        type="text"
                                        value={formData.billingProvince}
                                        onChange={(e) => handleChange('billingProvince', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Negara</label>
                                    <input
                                        type="text"
                                        value={formData.billingCountry}
                                        onChange={(e) => handleChange('billingCountry', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Shipping */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h3 className="text-sm font-bold text-warmgray-900">Alamat Pengiriman</h3>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            shippingAddress: prev.billingAddress,
                                            shippingCity: prev.billingCity,
                                            shippingProvince: prev.billingProvince,
                                            shippingCountry: prev.billingCountry,
                                            shippingZipCode: prev.billingZipCode
                                        }))}
                                        className="text-xs text-primary-600 hover:text-primary-700"
                                    >
                                        Salin dari Penagihan
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Alamat Lengkap</label>
                                    <textarea
                                        value={formData.shippingAddress}
                                        onChange={(e) => handleChange('shippingAddress', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-warmgray-700 mb-1">Kota</label>
                                        <input
                                            type="text"
                                            value={formData.shippingCity}
                                            onChange={(e) => handleChange('shippingCity', e.target.value)}
                                            className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-warmgray-700 mb-1">Kode Pos</label>
                                        <input
                                            type="text"
                                            value={formData.shippingZipCode}
                                            onChange={(e) => handleChange('shippingZipCode', e.target.value)}
                                            className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Provinsi</label>
                                    <input
                                        type="text"
                                        value={formData.shippingProvince}
                                        onChange={(e) => handleChange('shippingProvince', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Negara</label>
                                    <input
                                        type="text"
                                        value={formData.shippingCountry}
                                        onChange={(e) => handleChange('shippingCountry', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sales Tab */}
                    {activeTab === 'sales' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Syarat Pembayaran (Hari)</label>
                                    <input
                                        type="number"
                                        value={formData.paymentTerms}
                                        onChange={(e) => handleChange('paymentTerms', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <p className="text-xs text-warmgray-500 mt-1">Lama jatuh tempo faktur (Net n days)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Limit Piutang (IDR)</label>
                                    <input
                                        type="number"
                                        value={formData.creditLimit}
                                        onChange={(e) => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Kategori Harga</label>
                                    <select
                                        value={formData.priceCategory}
                                        onChange={(e) => handleChange('priceCategory', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="RETAIL">RETAIL</option>
                                        <option value="WHOLESALE">GROSIR</option>
                                        <option value="SPECIAL">KHUSUS</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Default Diskon (%)</label>
                                    <input
                                        type="number"
                                        value={formData.defaultDiscount}
                                        onChange={(e) => handleChange('defaultDiscount', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mt-6">
                                        <input
                                            type="checkbox"
                                            checked={formData.taxIncluded}
                                            onChange={(e) => handleChange('taxIncluded', e.target.checked)}
                                            className="rounded border-warmgray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-warmgray-700">Harga Jual Termasuk Pajak</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax Tab */}
                    {activeTab === 'tax' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Nama Wajib Pajak</label>
                                    <input
                                        type="text"
                                        value={formData.taxName}
                                        onChange={(e) => handleChange('taxName', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">NPWP</label>
                                    <input
                                        type="text"
                                        value={formData.npwp}
                                        onChange={(e) => handleChange('npwp', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">NPPKP</label>
                                    <input
                                        type="text"
                                        value={formData.nppkp}
                                        onChange={(e) => handleChange('nppkp', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">NIK (KTP)</label>
                                    <input
                                        type="text"
                                        value={formData.nik}
                                        onChange={(e) => handleChange('nik', e.target.value)}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Alamat Pajak</label>
                                    <textarea
                                        value={formData.taxAddress}
                                        onChange={(e) => handleChange('taxAddress', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-surface-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Accounts Tab */}
                    {activeTab === 'accounts' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                                <p className="text-sm text-blue-800">
                                    Atur akun default untuk transaksi otomatis pelanggan ini. Jika dikosongkan, sistem akan menggunakan akun default perusahaan.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <AccountSelect field="receivableAccountId" label="Akun Piutang" value={formData.receivableAccountId} />
                                <AccountSelect field="downPaymentAccountId" label="Akun Uang Muka" value={formData.downPaymentAccountId} />
                                <AccountSelect field="salesAccountId" label="Akun Penjualan" value={formData.salesAccountId} />
                                <AccountSelect field="salesReturnAccountId" label="Akun Retur Penjualan" value={formData.salesReturnAccountId} />
                                <AccountSelect field="salesDiscountAccountId" label="Akun Diskon Penjualan" value={formData.salesDiscountAccountId} />
                                <AccountSelect field="goodsDiscountAccountId" label="Akun Diskon Barang" value={formData.goodsDiscountAccountId} />
                                <AccountSelect field="cogsAccountId" label="Akun Beban Pokok (COGS)" value={formData.cogsAccountId} />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
