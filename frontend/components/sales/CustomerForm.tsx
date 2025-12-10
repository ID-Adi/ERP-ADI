'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Save,
    Trash2,
    RefreshCw,
    ArrowLeft,
    MapPin,
    CreditCard,
    FileText,
    User,
    Book,
    X,
    Printer,
    Paperclip,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { confirmAction, showSuccess, showError } from '@/lib/swal';
import PaymentTermSelect from '@/components/business/payment/PaymentTermSelect';
import SearchableSelect from '@/components/ui/SearchableSelect';

function Tooltip({ children, text }: { children: React.ReactNode, text: string }) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({
            top: rect.top - 8,
            left: rect.left + rect.width / 2
        });
        setShow(true);
    };

    return (
        <>
            <div onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)} className="flex">
                {children}
            </div>
            {show && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed px-2 py-1 text-xs text-white bg-gray-800 rounded pointer-events-none z-[9999] -translate-x-1/2 -translate-y-full whitespace-nowrap shadow-sm"
                    style={{ top: pos.top, left: pos.left }}
                >
                    {text}
                </div>,
                document.body
            )}
        </>
    )
}

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
        paymentTermId: savedData?.paymentTermId ?? (initialData?.paymentTermId || ''), // New field
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

                // Auto-fill defaults if not set and it's a new entry (or fields are empty)
                if (!isEdit && data.length > 0) {
                    setFormData(prev => {
                        const updates: any = {};

                        // Helper to find account by code (starts with) or type
                        // Note: Real logic depends on how 'type' is returned. Assuming 'type' field exists.
                        // If standard seed used: 
                        // ACCOUNTS_RECEIVABLE -> Piutang
                        // REVENUE -> Penjualan
                        // COGS -> Beban Pokok

                        // 1. Piutang (Receivable) - Type: ACCOUNTS_RECEIVABLE
                        if (!prev.receivableAccountId) {
                            const acc = data.find((a: any) => a.type === 'ACCOUNTS_RECEIVABLE');
                            if (acc) updates.receivableAccountId = acc.id;
                        }

                        // 2. Sales (Revenue) - Type: REVENUE. Prefer 'Penjualan Barang' or code 4-Something
                        if (!prev.salesAccountId) {
                            // Find 'Penjualan' in name or type REVENUE
                            const acc = data.find((a: any) => a.type === 'REVENUE' && a.name.includes('Penjualan'));
                            if (acc) updates.salesAccountId = acc.id;
                        }

                        // 3. COGS - Type: COGS
                        if (!prev.cogsAccountId) {
                            const acc = data.find((a: any) => a.type === 'COGS');
                            if (acc) updates.cogsAccountId = acc.id;
                        }

                        // 4. Sales Return - Type: SALES_RETURN (if exists) or REVENUE
                        if (!prev.salesReturnAccountId) {
                            const acc = data.find((a: any) => a.name.toLowerCase().includes('retur penjualan'));
                            if (acc) updates.salesReturnAccountId = acc.id;
                        }

                        // 5. Sales Discount - Type: SALES_DISCOUNT or REVENUE/EXPENSE
                        if (!prev.salesDiscountAccountId) {
                            const acc = data.find((a: any) => a.name.toLowerCase().includes('diskon penjualan'));
                            if (acc) updates.salesDiscountAccountId = acc.id;
                        }

                        // 6. Goods Discount - maybe same as sales discount or separate
                        if (!prev.goodsDiscountAccountId) {
                            // Optional: skip or set same as sales discount
                        }

                        // 7. Down Payment - Liability
                        if (!prev.downPaymentAccountId) {
                            const acc = data.find((a: any) => a.name.toLowerCase().includes('uang muka') || a.name.toLowerCase().includes('deposit'));
                            if (acc) updates.downPaymentAccountId = acc.id;
                        }

                        return { ...prev, ...updates };
                    });
                }

            } catch (err) {
                console.error('Failed to fetch accounts', err);
            }
        };
        fetchAccounts();
    }, [isEdit]);

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
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium border-t border-x rounded-t-lg transition-colors relative top-[1px]",
                    activeTab === id
                        ? "bg-white border-surface-200 text-warmgray-900 border-b-white z-10"
                        : "bg-surface-200 border-transparent text-warmgray-500 hover:text-warmgray-700"
                )}
            >
                <Icon className="h-4 w-4" />
                {label}
            </button>
        );
    };

    const AccountSelect = ({ label, field, value }: any) => {
        const options = accounts.map(acc => ({
            value: acc.id,
            label: acc.name,
            description: acc.code
        }));

        return (
            <SearchableSelect
                label={label}
                value={value}
                onChange={(val) => handleChange(field, val)}
                options={options}
                placeholder="-- Pilih Akun --"
            />
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-surface-200 flex-none relative z-50">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-surface-100 rounded-t-lg px-4 py-2 border-t border-x border-surface-200 -mb-[13px] z-10 relative bg-white">
                        <span className="text-sm font-medium text-warmgray-900">
                            {isEdit ? `Edit: ${initialData.name}` : 'Pelanggan Baru'}
                        </span>
                        <button onClick={onCancel} className="ml-2 text-warmgray-400 hover:text-warmgray-600">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEdit && (
                        <Tooltip text="Hapus">
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded shadow-sm border border-red-200"
                            >
                                {deleting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                            </button>
                        </Tooltip>
                    )}
                    <Tooltip text="Simpan">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-sm"
                        >
                            {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        </button>
                    </Tooltip>
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

            {/* Tabs Header */}
            <div className="flex px-4 pt-4 bg-surface-100 border-b border-surface-200 flex-none">
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
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Syarat Pembayaran</label>
                                    <PaymentTermSelect
                                        value={formData.paymentTermId}
                                        onChange={(id, days) => {
                                            handleChange('paymentTermId', id);
                                            // Also update legacy field for backward compatibility if needed, 
                                            // or just use it for display if 'days' is passed.
                                            // But the backend expects 'paymentTermId' now primarily?
                                            // Actually backend still has paymentTerms (Int). 
                                            // Let's keep both in sync if possible, or just rely on ID.
                                            // For now, let's sync days to legacy field to be safe.
                                            if (days !== undefined) handleChange('paymentTerms', days);
                                        }}
                                    />
                                    <p className="text-xs text-warmgray-500 mt-1">Lama jatuh tempo faktur</p>
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
