'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Package, List, AlignLeft, Search, Calendar, User, Hash,
  Settings, ChevronRight, Calculator, AlertCircle, DollarSign, History, Trash2
} from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { confirmAction } from '@/lib/swal';
import InvoiceItemsView from './invoice/InvoiceItemsView';
import InvoiceInfoView from './invoice/InvoiceInfoView';
import InvoiceCostsView from './invoice/InvoiceCostsView';
import InvoiceHistoryView from './invoice/InvoiceHistoryView';
import CustomerSelect from './invoice/CustomerSelect';

// --- Interfaces ---
interface LineItem {
  id: string;
  itemId?: string; // Database ID for backend
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  lineAmount: number;
  taxAmount: number;
  totalAmount: number;
  warehouseId?: string;
  salespersonId?: string;
}

interface InvoiceFormProps {
  initialData: {
    vendorCode: string;
    fakturDate: string;
    dueDate: string;
    memo: string;
    lines: LineItem[];
    currency?: string;
    fakturNumber?: string;
    id?: string;
    salespersonId?: string;
  };
  onDataChange: (data: any) => void;
  onSave: () => void;
  // Legacy props compatibility
  tabLabel?: string;
  onTabLabelChange?: (label: string) => void;
}

type ViewType = 'items' | 'info' | 'costs' | 'history';

export default function InvoiceForm({
  initialData,
  onDataChange,
  onSave,
}: InvoiceFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('items');

  // State for manual invoice number toggle
  const [isManualFaktur, setIsManualFaktur] = useState(false);

  // Data State
  const [customers, setCustomers] = useState<any[]>([]);

  // Centralized State
  const [formData, setFormData] = useState({
    ...initialData,
    currency: initialData.currency || 'IDR',
    fakturNumber: initialData.fakturNumber || 'Auto-Generated',
    // New Fields
    paymentTerms: (initialData as any).paymentTerms || '',
    taxInclusive: (initialData as any).taxInclusive ?? true, // Default to true (Tax Inclusive)
    shippingDate: (initialData as any).shippingDate || new Date().toISOString().split('T')[0],
    dueDate: initialData.dueDate || new Date().toISOString().split('T')[0], // Default to Now
    salespersonId: initialData.salespersonId || '',
  });

  const [lines, setLines] = useState<LineItem[]>(initialData.lines || []);

  // Fetch Customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers');
        setCustomers(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  // Auto-set Salesperson from first line item
  useEffect(() => {
    if (lines.length > 0) {
      const firstLine = lines[0];
      // Only update if formData.salespersonId is empty or different from the first line's salesperson
      // AND the first line actually has a salesperson
      // Logic: "if not yet available take salesperson name from the first product input in the table"
      // "and add logic if the first product is deleted then take from the product in the table data at the top!"

      // We can simply say: Always sync the invoice salesperson with the first line's salesperson IF the invoice salesperson is not manually set?
      // Or strictly follow: "if not yet available" -> implies only if empty.
      // But "if first product deleted then take from top" implies dynamic update.
      // So, let's make it dynamic: If lines exist, default salesperson to the first line's salesperson.
      // But we should probably allow manual override? The user didn't ask for manual override on the invoice level, 
      // they asked for logic to *take* it from the table.

      if (firstLine.salespersonId) {
        setFormData(prev => {
          if (prev.salespersonId !== firstLine.salespersonId) {
            return { ...prev, salespersonId: firstLine.salespersonId || '' };
          }
          return prev;
        });
      }
    }
  }, [lines]);

  // Calculations State
  const [totals, setTotals] = useState({
    subtotal: 0,
    discountTotal: 0, // Item level discounts
    globalDiscount: 0,
    taxTotal: 0,
    grandTotal: 0,
  });

  // --- Effects ---
  useEffect(() => {
    // Recalculate Totals
    const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
    const itemDiscounts = lines.reduce((sum, line) => sum + line.discountAmount, 0);
    const taxableBase = subtotal - itemDiscounts;

    let tax = 0;
    let grandTotal = 0;

    if ((formData as any).taxInclusive) {
      // Tax Inclusive Logic:
      // The price entered IS the final price.
      // Grand Total = Subtotal - Discounts.
      // Tax is calculated backwards from the amount.
      grandTotal = taxableBase;

      // Calculate tax component for display (assuming 11% VAT included)
      // Amount = Base + (Base * 0.11) = Base * 1.11
      // Base = Amount / 1.11
      // Tax = Amount - Base
      const base = taxableBase / 1.11;
      tax = taxableBase - base;
    } else {
      // Tax Exclusive Logic:
      // Tax is added on top of the taxable base.
      // We try to use line-item tax amounts if available, otherwise fallback to flat 11%
      const lineTaxSum = lines.reduce((sum, line) => sum + line.taxAmount, 0);
      tax = lineTaxSum > 0 ? lineTaxSum : (taxableBase * 0.11);
      grandTotal = taxableBase + tax;
    }

    setTotals({
      subtotal,
      discountTotal: itemDiscounts,
      globalDiscount: 0,
      taxTotal: tax,
      grandTotal
    });

    const newData = { ...formData, lines };
    onDataChange(newData);
  }, [lines, formData, onDataChange]);

  // Handle Manual Faktur Toggle
  const handleManualFakturToggle = () => {
    const newState = !isManualFaktur;
    setIsManualFaktur(newState);
    if (!newState) {
      // Reset to Auto if turned off
      setFormData(prev => ({ ...prev, fakturNumber: 'Auto-Generated' }));
    } else {
      // Clear for manual input if turning on (or keep existing if not auto)
      if (formData.fakturNumber === 'Auto-Generated') {
        setFormData(prev => ({ ...prev, fakturNumber: '' }));
      }
    }
  };


  // --- Handlers ---
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (code: string) => {
    setFormData(prev => ({ ...prev, vendorCode: code }));
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, vendorCode: e.target.value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent, statusOverride?: string) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Find the selected customer to get customer ID
      const selectedCustomer = customers.find(c => c.code === formData.vendorCode);

      if (!selectedCustomer) {
        addToast({
          type: 'error',
          title: 'Kesalahan Validasi',
          message: 'Harap pilih pelanggan sebelum menyimpan.',
        });
        setIsLoading(false);
        return;
      }

      if (lines.length === 0) {
        addToast({
          type: 'error',
          title: 'Kesalahan Validasi',
          message: 'Harap tambahkan setidaknya satu barang sebelum menyimpan.',
        });
        setIsLoading(false);
        return;
      }

      if (!(formData as any).paymentTerms) {
        addToast({
          type: 'error',
          title: 'Kesalahan Validasi',
          message: 'Syarat Pembayaran wajib diisi.',
        });
        setIsLoading(false);
        return;
      }

      // Build payload for API
      const payload = {
        companyId: 'default-company', // TODO: Get from auth context
        fakturNumber: isManualFaktur ? formData.fakturNumber : undefined, // Let backend generate if not manual
        fakturDate: formData.fakturDate,
        dueDate: formData.dueDate || null,
        paymentTerms: (formData as any).paymentTerms, // Include payment terms
        shippingDate: (formData as any).shippingDate,
        taxInclusive: (formData as any).taxInclusive,
        customerId: selectedCustomer.id,
        salespersonId: formData.salespersonId || undefined,
        currency: formData.currency || 'IDR',
        subtotal: totals.subtotal,
        discountPercent: 0,
        discountAmount: totals.discountTotal,
        taxPercent: 11,
        taxAmount: totals.taxTotal,
        totalAmount: totals.grandTotal,
        balanceDue: totals.grandTotal,
        notes: formData.memo || '',
        status: 'UNPAID', // Default to UNPAID (Belum Lunas) instead of DRAFT
        createdBy: 'admin', // TODO: Get from auth context
        lines: lines.map(line => ({
          itemId: line.itemId, // Use the actual database ID stored from product selection
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          amount: line.lineAmount,
          warehouseId: line.warehouseId
        }))
      };

      if (initialData.id) {
        // Update existing invoice
        await api.put(`/fakturs/${initialData.id}`, payload);
        addToast({
          type: 'success',
          title: 'Faktur Diperbarui',
          message: 'Perubahan faktur berhasil disimpan.',
        });
      } else {
        // Create new invoice
        await api.post('/fakturs', payload);
        addToast({
          type: 'success',
          title: 'Faktur Tersimpan',
          message: 'Faktur berhasil disimpan ke database.',
        });
      }
      onSave();
      router.push('/dashboard/sales/faktur');
    } catch (error: any) {
      console.error('Failed to save invoice:', error);
      addToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: error?.response?.data?.error || 'Terjadi kesalahan saat menyimpan faktur.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!initialData.id) return;

    const result = await confirmAction(
      'Hapus Faktur',
      'Apakah Anda yakin ingin menghapus faktur ini? Data yang dihapus tidak dapat dikembalikan.',
      'Ya, Hapus'
    );

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      await api.delete(`/fakturs/${initialData.id}`);
      addToast({
        type: 'success',
        title: 'Faktur Dihapus',
        message: 'Faktur berhasil dihapus.',
      });
      onSave(); // Trigger refresh on parent
      router.push('/dashboard/sales/faktur');
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: 'Gagal menghapus faktur.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Draft Handler (Create Only)
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const selectedCustomer = customers.find(c => c.code === formData.vendorCode);
      const payload = {
        companyId: 'default-company',
        fakturNumber: isManualFaktur ? formData.fakturNumber : undefined,
        fakturDate: formData.fakturDate,
        dueDate: formData.dueDate || null,
        customerId: selectedCustomer?.id || undefined,
        salespersonId: formData.salespersonId || undefined,
        status: 'DRAFT',
        currency: formData.currency || 'IDR',
        subtotal: totals.subtotal,
        totalAmount: totals.grandTotal,
        balanceDue: totals.grandTotal,
        lines: lines.map(line => ({
          itemId: line.itemId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          amount: line.lineAmount
        }))
      };
      await api.post('/fakturs', payload);
      addToast({ type: 'success', title: 'Draf Tersimpan', message: 'Faktur draf berhasil disimpan.' });
      router.push('/dashboard/sales/faktur');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-[#f0f2f5] overflow-hidden font-sans">

      {/* 1. Left Sidebar Navigation */}
      <div className="w-[60px] flex-shrink-0 bg-white border-r border-warmgray-200 flex flex-col items-center py-4 gap-4 z-40">

        <SidebarButton
          active={activeView === 'items'}
          onClick={() => setActiveView('items')}
          icon={Package}
          label="Rincian Barang"
        />
        <SidebarButton
          active={activeView === 'info'}
          onClick={() => setActiveView('info')}
          icon={AlertCircle}
          label="Info Lainnya"
        />
        <SidebarButton
          active={activeView === 'costs'}
          onClick={() => setActiveView('costs')}
          icon={DollarSign}
          label="Biaya Lainnya"
        />
        {initialData.id && (
          <SidebarButton
            active={activeView === 'history'}
            onClick={() => setActiveView('history')}
            icon={History}
            label="Informasi Faktur"
          />
        )}
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Info Bar (Fixed) - Only visible in Rincian Barang */}
        {activeView === 'items' && (
          <div className="bg-white border-b border-warmgray-200 px-6 py-4 flex-shrink-0 relative z-30">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-[#d95d39]" />
              <h2 className="text-[#d95d39] font-bold text-lg">Informasi Faktur</h2>
            </div>

            <div className="flex flex-wrap gap-6 items-start">
              {/* Left Group */}
              {/* Customer */}
              <div className="w-full max-w-[400px]">
                <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">Pelanggan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <CustomerSelect
                    value={formData.vendorCode}
                    onChange={handleCustomerSelect}
                    customers={customers.map(c => ({
                      code: c.code || c.id,
                      name: c.name,
                      phone: c.phone || c.mobile,
                      address: c.billingCity ? `${c.billingAddress}, ${c.billingCity}` : c.billingAddress
                    }))}
                  />
                </div>
              </div>

              {/* Date */}
              {/* Date */}
              <div className="w-full max-w-[200px]">
                <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">Tanggal Faktur</label>
                <div className="relative">
                  <input
                    type="date"
                    name="fakturDate"
                    value={formData.fakturDate}
                    onChange={handleDateChange}
                    className="w-full pl-9 pr-3 h-[38px] border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-warmgray-900 font-medium transition-shadow cursor-pointer"
                  />
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-warmgray-400 pointer-events-none" />
                </div>
              </div>

              {/* Currency */}
              <div className="w-full max-w-[250px]">
                <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">Mata Uang</label>
                <div className="relative">
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleVendorChange}
                    className="w-full px-3 h-[38px] border border-warmgray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 appearance-none text-warmgray-900 font-medium transition-shadow"
                  >
                    <option value="IDR">IDR - Rupiah Indonesia</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>
              </div>

              {/* Due Date - REMOVED */}

              {/* Invoice Number (Right) */}
              <div className="w-full max-w-[350px] ml-auto lg:ml-0">
                <label className="block text-[10px] font-bold text-warmgray-500 uppercase tracking-wider mb-1">No. Faktur</label>

                <div className="flex gap-2 items-center">
                  {/* Toggle Switch (Left Side) */}
                  <div
                    className="flex items-center justify-center h-[38px] px-2 cursor-pointer group rounded border border-transparent hover:bg-warmgray-50 transition-colors"
                    onClick={handleManualFakturToggle}
                    title={isManualFaktur ? "Mode Manual Aktif" : "Mode Auto-Generated"}
                  >
                    <div className={cn(
                      "w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out flex-shrink-0",
                      isManualFaktur ? "bg-primary-500" : "bg-warmgray-300 group-hover:bg-warmgray-400"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm",
                        isManualFaktur ? "translate-x-4.5" : "translate-x-0.5"
                      )} style={{ transform: isManualFaktur ? 'translateX(18px)' : 'translateX(2px)' }} />
                    </div>
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.fakturNumber}
                      readOnly={!isManualFaktur}
                      onChange={(e) => handleFormChange('fakturNumber', e.target.value)}
                      placeholder={isManualFaktur ? "Masukkan No. Faktur" : "Auto-Generated"}
                      className={cn(
                        "w-full pl-9 pr-3 h-[38px] border rounded text-sm font-medium transition-all focus:outline-none",
                        isManualFaktur
                          ? "bg-white border-warmgray-300 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-warmgray-900"
                          : "bg-warmgray-100 border-warmgray-200 text-warmgray-500 cursor-not-allowed select-none"
                      )}
                    />
                    <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-warmgray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* View Content Area */}
        <div className="flex-1 overflow-hidden p-6 relative bg-[#f0f2f5]">
          {activeView === 'items' && (
            <InvoiceItemsView
              items={lines}
              onItemsChange={setLines}
              // Determine status: 
              // 1. If no ID (or specific flag), it's "New Data" (unsaved) -> No Stamp
              // 2. If Saved & Paid -> 'paid'
              // 3. If Saved & Unpaid -> 'unpaid'
              // For now, let's assume if it has an ID, it is saved. And default to 'unpaid' for demo unless specified.
              status={initialData.id ? 'unpaid' : 'unsaved'}
            />
          )}

          {activeView === 'info' && (
            <InvoiceInfoView
              formData={formData}
              onChange={handleFormChange}
            />
          )}

          {activeView === 'costs' && (
            <InvoiceCostsView
              invoiceId={initialData.id}
            />
          )}

          {activeView === 'history' && (
            <InvoiceHistoryView
              formData={formData}
              totals={totals}
              invoiceId={initialData.id}
            />
          )}
        </div>

        {/* Bottom Action Bar (Sticky) */}
        <div className="bg-white border-t border-warmgray-300 px-6 py-3 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20">
          {/* Grand Total Display */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-warmgray-600">Subtotal</span>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-warmgray-900">{formatCurrency(totals.subtotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-warmgray-600">Diskon</span>
                <span className="bg-primary-50 text-primary-600 text-[10px] px-1 rounded border border-primary-100">%</span>
              </div>
              <div className="flex items-center border border-warmgray-300 rounded bg-white w-32 overflow-hidden">
                <span className="bg-warmgray-50 px-2 py-1 text-xs text-warmgray-500 border-r border-warmgray-300">Rp</span>
                <input
                  type="number"
                  value={0}
                  className="w-full py-1 px-2 text-right text-sm border-none focus:ring-0 outline-none"
                  readOnly
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-warmgray-700">Total</span>
              <span className="text-lg font-bold text-warmgray-900">{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-px bg-warmgray-300 mx-2"></div>
            <button
              onClick={() => router.back()}
              className="text-warmgray-600 hover:text-warmgray-900 font-medium text-sm transition-colors"
              type="button"
            >
              batalkan
            </button>

            {initialData.id ? (
              <Button
                variant="outline"
                className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300 font-semibold"
                onClick={handleDelete}
                isLoading={isLoading}
                type="button"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="bg-warmgray-200 hover:bg-warmgray-300 text-warmgray-800 border-none font-semibold"
                onClick={(e) => handleSaveDraft(e)}
                isLoading={isLoading}
                type="button"
              >
                Simpan Draf
              </Button>
            )}

            <Button
              variant="primary"
              className="bg-[#d95d39] hover:bg-[#c44e2b] text-white border-none font-semibold shadow-md"
              onClick={(e) => handleSubmit(e, 'UNPAID')}
              isLoading={isLoading}
              type="button"
            >
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Side Button Component
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
