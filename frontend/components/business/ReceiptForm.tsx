'use client';

import { useState, useEffect } from 'react';
import {
    FileText, AlertCircle, Trash2, Save, X, Printer, Paperclip, Settings
} from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { confirmAction } from '@/lib/swal';
import SearchableSelect from '@/components/ui/SearchableSelect';
import DatePicker from '@/components/ui/DatePicker';
import { createPortal } from 'react-dom';

// --- Tooltip Component (Copied from InvoiceForm) ---
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

// --- Interfaces ---
interface ReceiptLine {
    fakturId: string;
    fakturNumber: string;
    fakturDate: string;
    total: number;
    amountPaid: number; // Previously paid
    remaining: number;
    thisPayment: number; // Amount being paid now
}

interface ReceiptFormProps {
    initialData?: any;
    onCancel: () => void; // Kept in props for consistency, but unused in new UI
    onSuccess: () => void;
}

type ViewType = 'invoices' | 'info';

export default function ReceiptForm({ initialData, onSuccess }: ReceiptFormProps) {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [activeView, setActiveView] = useState<ViewType>('invoices');

    const isEdit = !!initialData?.id;

    // --- Form State ---
    const [formData, setFormData] = useState({
        customerId: initialData?.customerId || '',
        customerName: initialData?.customer?.name || '',
        bankId: initialData?.bankAccountId || '',
        bankName: initialData?.bankAccount?.name || '',
        receiptNumber: initialData?.receiptNumber || '',
        receiptDate: initialData?.receiptDate
            ? new Date(initialData.receiptDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        amount: initialData ? Number(initialData.amount) : 0,
        notes: initialData?.notes || '',
    });

    const [selectedInvoices, setSelectedInvoices] = useState<ReceiptLine[]>([]);

    // Options State
    const [bankOptions, setBankOptions] = useState<any[]>([]);
    const [customerOptions, setCustomerOptions] = useState<any[]>([]);
    const [invoiceOptions, setInvoiceOptions] = useState<any[]>([]);

    // --- Initial Data Loading ---
    useEffect(() => {
        if (initialData && initialData.lines) {
            const lines = initialData.lines.map((line: any) => ({
                fakturId: line.fakturId,
                fakturNumber: line.faktur?.fakturNumber,
                fakturDate: line.faktur?.fakturDate ? new Date(line.faktur.fakturDate).toISOString().split('T')[0] : '-',
                total: Number(line.faktur?.totalAmount || 0),
                amountPaid: Number(line.faktur?.amountPaid) - Number(line.amount), // Exclude current payment for editing
                remaining: (Number(line.faktur?.totalAmount || 0) - (Number(line.faktur?.amountPaid) - Number(line.amount))),
                thisPayment: Number(line.amount)
            }));
            setSelectedInvoices(lines);
        }
    }, [initialData]);

    // --- Fetch Master Data ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [banksRes, customersRes] = await Promise.all([
                    api.get('/accounts'),
                    api.get('/customers')
                ]);

                if (banksRes.data && banksRes.data.data) {
                    const banks = banksRes.data.data
                        .filter((acc: any) => (acc.type === 'CASH_AND_BANK' || acc.type === 'BANK' || acc.type === 'CASH') && !acc.isHeader)
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
                console.error("Failed to fetch master data", err);
                addToast({ type: 'error', title: 'Error', message: 'Gagal memuat data master' });
            }
        };
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Fetch Invoices when Customer Changes ---
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
                    const options = res.data.data
                        .filter((inv: any) => !selectedInvoices.find(si => si.fakturId === inv.id))
                        .map((inv: any) => ({
                            value: inv.id,
                            label: `${inv.fakturNumber} - ${formatCurrency(inv.totalAmount - (inv.amountPaid || 0))}`,
                            originalData: {
                                faturId: inv.id, // Fixed typo in original usage if any, but using inv.id
                                fakturId: inv.id,
                                fakturNumber: inv.fakturNumber,
                                fakturDate: new Date(inv.fakturDate).toISOString().split('T')[0],
                                total: Number(inv.totalAmount),
                                amountPaid: Number(inv.amountPaid || 0),
                                remaining: Number(inv.totalAmount) - Number(inv.amountPaid || 0),
                                thisPayment: Number(inv.totalAmount) - Number(inv.amountPaid || 0) // Default to full remaining
                            }
                        }));
                    setInvoiceOptions(options);
                }
            } catch (err) {
                console.error("Failed to fetch invoices", err);
            }
        };

        fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.customerId, selectedInvoices.length]);

    // --- Handlers ---
    const handleAddInvoice = (invoiceData: any) => {
        setSelectedInvoices(prev => [...prev, invoiceData]);
    };

    const handleRemoveInvoice = (fakturId: string) => {
        setSelectedInvoices(prev => prev.filter(inv => inv.fakturId !== fakturId));
    };

    const handlePaymentAmountChange = (fakturId: string, amount: number) => {
        setSelectedInvoices(prev => prev.map(inv => {
            if (inv.fakturId === fakturId) {
                return { ...inv, thisPayment: amount };
            }
            return inv;
        }));
    };

    const calculateTotal = () => {
        return selectedInvoices.reduce((sum, inv) => sum + (inv.thisPayment || 0), 0);
    };

    const handleSave = async () => {
        if (!formData.customerId || !formData.bankId || selectedInvoices.length === 0) {
            addToast({ type: 'error', title: 'Validasi', message: 'Harap lengkapi data (Pelanggan, Bank, dan Faktur)' });
            return;
        }

        setIsLoading(true);

        const lines = selectedInvoices.map((inv) => ({
            fakturId: inv.fakturId,
            amount: inv.thisPayment
        }));

        const totalAmount = calculateTotal();

        const payload = {
            receiptDate: formData.receiptDate,
            customerId: formData.customerId,
            bankAccountId: formData.bankId,
            amount: totalAmount,
            notes: formData.notes,
            lines
        };

        try {
            if (isEdit && initialData?.id) {
                await api.put(`/sales-receipts/${initialData.id}`, payload);
                addToast({ type: 'success', title: 'Berhasil', message: 'Penerimaan berhasil diperbarui' });
            } else {
                await api.post('/sales-receipts', payload);
                addToast({ type: 'success', title: 'Berhasil', message: 'Penerimaan berhasil disimpan' });
            }
            onSuccess();
        } catch (err: any) {
            console.error(err);
            addToast({
                type: 'error',
                title: 'Gagal',
                message: err.response?.data?.message || err.response?.data?.error || "Gagal menyimpan"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;

        const result = await confirmAction("Hapus Penerimaan", "Apakah Anda yakin ingin menghapus data ini?", "Ya, Hapus");
        if (!result.isConfirmed) return;

        setIsLoading(true);
        try {
            await api.delete(`/sales-receipts/${initialData.id}`);
            addToast({ type: 'success', title: 'Berhasil', message: 'Penerimaan berhasil dihapus' });
            onSuccess();
        } catch (err: any) {
            console.error(err);
            addToast({ type: 'error', title: 'Gagal', message: err.response?.data?.message || "Gagal menghapus" });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render ---
    return (
        <div className="flex h-full bg-[#f0f2f5] overflow-hidden font-sans">
            {/* 1. Left Sidebar Navigation */}
            <div className="w-[60px] flex-shrink-0 bg-white border-r border-warmgray-200 flex flex-col items-center py-4 gap-4 z-40">
                <SidebarButton
                    active={activeView === 'invoices'}
                    onClick={() => setActiveView('invoices')}
                    icon={FileText}
                    label="Rincian"
                />
                <SidebarButton
                    active={activeView === 'info'}
                    onClick={() => setActiveView('info')}
                    icon={AlertCircle}
                    label="Info Lainnya"
                />
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top Info Bar (Fixed) */}
                <div className="bg-white border-b border-warmgray-200 px-6 py-4 flex-shrink-0 relative z-30">
                    {/* Header Text and Icon Removed as requested */}

                    <div className="flex flex-wrap gap-6 items-start">
                        {/* Customer */}
                        <div className="w-full max-w-[350px]">
                            <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">
                                Terima Dari <span className="text-red-500">*</span>
                            </label>
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
                                    if (val !== formData.customerId) {
                                        setSelectedInvoices([]);
                                    }
                                }}
                                placeholder="Cari Pelanggan..."
                                className="w-full"
                            />
                        </div>

                        {/* Bank */}
                        <div className="w-full max-w-[300px]">
                            <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">
                                Setor Ke (Kas/Bank) <span className="text-red-500">*</span>
                            </label>
                            <SearchableSelect
                                options={bankOptions}
                                value={formData.bankId}
                                onChange={(val) => {
                                    const selected = bankOptions.find(opt => opt.value === val);
                                    setFormData({ ...formData, bankId: val, bankName: selected ? selected.label : '' });
                                }}
                                placeholder="Pilih Akun..."
                                className="w-full"
                            />
                        </div>

                        {/* Date - Updated to custom DatePicker */}
                        <div className="w-full max-w-[150px]">
                            <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">
                                Tanggal
                            </label>
                            <div className="relative h-[38px] min-h-[38px] max-h-[38px]">
                                <DatePicker
                                    value={formData.receiptDate}
                                    onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* View Content Area */}
                <div className="flex-1 overflow-hidden p-6 relative bg-[#f0f2f5]">
                    {activeView === 'invoices' && (
                        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-warmgray-200 overflow-hidden">
                            {/* Toolbar */}
                            <div className="p-3 border-b border-warmgray-200 bg-warmgray-50/50 flex items-center gap-3">
                                <div className={cn("relative flex-1 max-w-xl", !formData.customerId && "cursor-not-allowed opacity-60")}>
                                    <SearchableSelect
                                        options={invoiceOptions}
                                        value=""
                                        onChange={(val) => {
                                            if (!val) return;
                                            const selected = invoiceOptions.find(opt => opt.value === val);
                                            if (selected && selected.originalData) {
                                                handleAddInvoice(selected.originalData);
                                            }
                                        }}
                                        placeholder={formData.customerId ? "Cari No. Faktur untuk ditambah..." : "Pilih Pelanggan Dulu..."}
                                        className="w-full"
                                        disabled={!formData.customerId}
                                    />
                                </div>
                                <div className="px-3 py-1.5 bg-white border border-warmgray-300 rounded text-sm font-medium text-warmgray-700 shadow-sm">
                                    Total Item: {selectedInvoices.length}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-auto bg-white relative">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-warmgray-50 text-warmgray-600 font-semibold border-b border-warmgray-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="py-2.5 px-4 w-[50px] text-center border-r border-warmgray-200">No</th>
                                            <th className="py-2.5 px-4 border-r border-warmgray-200">No. Faktur</th>
                                            <th className="py-2.5 px-4 border-r border-warmgray-200">Tgl Faktur</th>
                                            <th className="py-2.5 px-4 text-right border-r border-warmgray-200">Total Tagihan</th>
                                            <th className="py-2.5 px-4 text-right border-r border-warmgray-200">Sisa Tagihan</th>
                                            <th className="py-2.5 px-4 text-right border-r border-warmgray-200 w-[200px]">Pembayaran Ini</th>
                                            <th className="py-2.5 px-2 w-[50px] text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-warmgray-100">
                                        {selectedInvoices.map((inv, index) => (
                                            <tr key={inv.fakturId} className="hover:bg-primary-50 transition-colors">
                                                <td className="py-2 px-4 text-center text-warmgray-400 border-r border-warmgray-100">{index + 1}</td>
                                                <td className="py-2 px-4 font-medium text-warmgray-900 border-r border-warmgray-100">{inv.fakturNumber}</td>
                                                <td className="py-2 px-4 text-warmgray-500 border-r border-warmgray-100">{inv.fakturDate}</td>
                                                <td className="py-2 px-4 text-right font-medium text-warmgray-700 border-r border-warmgray-100">
                                                    {formatCurrency(inv.total).replace('Rp', '')}
                                                </td>
                                                <td className="py-2 px-4 text-right font-medium text-warmgray-700 border-r border-warmgray-100">
                                                    {formatCurrency(inv.remaining).replace('Rp', '')}
                                                </td>
                                                <td className="py-2 px-4 text-right border-r border-warmgray-100 p-0">
                                                    {/* Custom Input for Payment */}
                                                    <input
                                                        type="number"
                                                        className="w-full text-right px-2 py-1 bg-primary-50/30 border border-transparent focus:bg-white focus:border-primary-400 focus:outline-none rounded font-bold text-primary-700 h-[30px]"
                                                        value={inv.thisPayment}
                                                        onChange={(e) => handlePaymentAmountChange(inv.fakturId, parseFloat(e.target.value) || 0)}
                                                        min={0}
                                                    />
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <button
                                                        onClick={() => handleRemoveInvoice(inv.fakturId)}
                                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {selectedInvoices.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-warmgray-400 italic bg-warmgray-50/20">
                                                    Belum ada faktur yang dipilih
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeView === 'info' && (
                        <div className="bg-white rounded-lg shadow-sm border border-warmgray-200 p-6 max-w-2xl mx-auto">
                            <h3 className="font-bold text-lg text-warmgray-800 mb-4">Informasi Tambahan</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 mb-1">Catatan</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-warmgray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[120px]"
                                        placeholder="Tambahkan catatan..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Action Bar (Sticky) - Redesigned to match InvoiceForm */}
                <div className="bg-white border-t border-warmgray-300 px-6 py-3 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20">
                    {/* Total Diterima Display - Matched to Invoice Footer Box */}
                    <div className="flex items-center gap-0 divide-x divide-warmgray-200 border border-warmgray-200 rounded-lg overflow-hidden bg-white">
                        <div className="px-4 py-2 flex flex-col min-w-[150px] bg-warmgray-50/50">
                            <span className="text-xs font-semibold text-warmgray-500 mb-1">Total Diterima</span>
                            <span className="text-base font-bold text-warmgray-900">{formatCurrency(calculateTotal())}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Cancel button removed (text version) */}

                        <div className="h-6 w-px bg-warmgray-300 mx-2"></div>

                        {isEdit && (
                            <Tooltip text="Hapus Penerimaan">
                                <button
                                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    type="button"
                                >
                                    <Trash2 className="h-6 w-6" />
                                </button>
                            </Tooltip>
                        )}

                        <Tooltip text="Simpan Transaksi">
                            <button
                                className="p-3 bg-[#d95d39] hover:bg-[#c44e2b] text-white border border-transparent rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSave}
                                disabled={isLoading}
                                type="button"
                            >
                                <Save className="h-6 w-6" />
                            </button>
                        </Tooltip>

                        <Tooltip text="Cetak">
                            <button
                                className="p-3 text-[#d95d39] bg-[#fff5f2] hover:bg-[#ffeadd] rounded-lg transition-colors border border-[#ffd6c9] shadow-sm"
                                type="button"
                                onClick={() => { }}
                            >
                                <Printer className="h-6 w-6" />
                            </button>
                        </Tooltip>

                        <Tooltip text="Lampiran">
                            <button
                                className="p-3 text-[#d95d39] bg-[#fff5f2] hover:bg-[#ffeadd] rounded-lg transition-colors border border-[#ffd6c9] shadow-sm"
                                type="button"
                                onClick={() => { }}
                            >
                                <Paperclip className="h-6 w-6" />
                            </button>
                        </Tooltip>

                        <Tooltip text="Pengaturan">
                            <button
                                className="p-3 text-[#d95d39] bg-[#fff5f2] hover:bg-[#ffeadd] rounded-lg transition-colors border border-[#ffd6c9] shadow-sm"
                                type="button"
                                onClick={() => { }}
                            >
                                <Settings className="h-6 w-6" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---

function SidebarButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <div className="group relative flex items-center justify-center w-full">
            <button
                onClick={onClick}
                className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200",
                    active
                        ? "bg-primary-50 text-primary-600 shadow-sm ring-1 ring-primary-200"
                        : "text-warmgray-400 hover:bg-warmgray-50 hover:text-warmgray-600"
                )}
            >
                <Icon className="h-5 w-5" />
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {label}
            </div>
        </div>
    )
}
