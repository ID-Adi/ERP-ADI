'use client';

import { MapPin, Truck, AlertCircle, Search, X, Receipt } from 'lucide-react';
// import SearchableSelect from '@/components/ui/SearchableSelect'; // Unused
import DatePicker from '@/components/ui/DatePicker';
import { cn } from '@/lib/utils';
import PaymentTermSelect from '@/components/business/payment/PaymentTermSelect';

interface InvoiceInfoViewProps {
    formData: any;
    onChange: (field: string, value: any) => void;
    onPaymentTermChange: (termId: string, days?: number) => void;
    paymentTermsList?: any[];
}

export default function InvoiceInfoView({ formData, onChange, onPaymentTermChange, paymentTermsList }: InvoiceInfoViewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full bg-white rounded-lg shadow-sm border border-warmgray-200 p-6 overflow-auto">

            {/* Left Column: Info Lainnya */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-primary-100 pb-2">
                    <AlertCircle className="h-5 w-5" />
                    <h3>Info Lainnya</h3>
                </div>

                <div className="space-y-4">
                    {/* Payment Terms */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700">
                            Syarat Pembayaran <span className="text-red-500">*</span>
                        </label>
                        <div className="col-span-8">
                            <PaymentTermSelect
                                value={formData.paymentTerms}
                                onChange={onPaymentTermChange}
                                terms={paymentTermsList}
                            />
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700">Jatuh Tempo</label>
                        <div className="col-span-8">
                            <DatePicker
                                value={formData.dueDate}
                                onChange={(e) => onChange('dueDate', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* No. PO */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700">No. PO</label>
                        <div className="col-span-8">
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-12 gap-4 items-start">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700 pt-2">Alamat</label>
                        <div className="col-span-8 flex gap-2">
                            <button className="p-2 border border-warmgray-300 rounded bg-white text-warmgray-600 hover:bg-warmgray-50 h-min">
                                <MapPin className="h-4 w-4" />
                            </button>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none font-mono"
                                value={formData.billingAddress || ''}
                                onChange={(e) => onChange('billingAddress', e.target.value)}
                                placeholder="Alamat penagihan..."
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-12 gap-4 items-start">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700 pt-2">Keterangan</label>
                        <div className="col-span-8">
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                                value={formData.memo}
                                onChange={(e) => onChange('memo', e.target.value)}
                                placeholder="Catatan tambahan..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Info Pajak & Pengiriman */}
            <div className="space-y-8">

                {/* Tax Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-primary-100 pb-2">
                        <Receipt className="h-5 w-5" />
                        <h3>Info Pajak</h3>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700 pt-1">Pengaturan Pajak</label>
                        <div className="col-span-8 space-y-3">
                            {/* Option 1: Exclusive (Tax Added) */}
                            <label className={cn(
                                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                !formData.taxInclusive ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500" : "border-warmgray-200 hover:border-warmgray-300"
                            )}>
                                <div className={cn(
                                    "w-4 h-4 rounded-full border border-warmgray-400 flex items-center justify-center bg-white",
                                    !formData.taxInclusive && "border-primary-600"
                                )}>
                                    {!formData.taxInclusive && <div className="w-2 h-2 rounded-full bg-primary-600" />}
                                </div>
                                <input
                                    type="radio"
                                    name="tax_mode"
                                    className="hidden"
                                    checked={!formData.taxInclusive}
                                    onChange={() => onChange('taxInclusive', false)}
                                />
                                <div className="flex flex-col">
                                    <span className={cn("text-sm font-medium", !formData.taxInclusive ? "text-primary-900" : "text-warmgray-700")}>Harga Belum Termasuk Pajak</span>
                                    <span className="text-xs text-warmgray-500">Pajak (PPN 11%) ditambahkan pada total</span>
                                </div>
                            </label>

                            {/* Option 2: Inclusive (Tax Included) */}
                            <label className={cn(
                                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                                formData.taxInclusive ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500" : "border-warmgray-200 hover:border-warmgray-300"
                            )}>
                                <div className={cn(
                                    "w-4 h-4 rounded-full border border-warmgray-400 flex items-center justify-center bg-white",
                                    formData.taxInclusive && "border-primary-600"
                                )}>
                                    {formData.taxInclusive && <div className="w-2 h-2 rounded-full bg-primary-600" />}
                                </div>
                                <input
                                    type="radio"
                                    name="tax_mode"
                                    className="hidden"
                                    checked={formData.taxInclusive}
                                    onChange={() => onChange('taxInclusive', true)}
                                />
                                <div className="flex flex-col">
                                    <span className={cn("text-sm font-medium", formData.taxInclusive ? "text-primary-900" : "text-warmgray-700")}>Harga Sudah Termasuk Pajak</span>
                                    <span className="text-xs text-warmgray-500">Pajak sudah termasuk dalam harga barang</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Shipping Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-primary-100 pb-2">
                        <Truck className="h-5 w-5" />
                        <h3>Info Pengiriman</h3>
                    </div>

                    <div className="space-y-4 relative">
                        {/* Stamp LUNAS (Smaller here) */}
                        {/* Stamp LUNAS (Smaller here) - Only show if PAID */}
                        {formData.status === 'PAID' && (
                            <div className="absolute top-10 left-0 pointer-events-none opacity-20 z-0 transform -rotate-12 scale-75 origin-top-left">
                                <div className="border-4 border-green-500 text-green-500 font-bold text-4xl px-4 py-1 rounded-lg tracking-widest">
                                    LUNAS
                                </div>
                            </div>
                        )}

                        {/* Shipping Date */}
                        <div className="grid grid-cols-12 gap-4 items-center z-20 relative">
                            <label className="col-span-4 text-sm font-medium text-warmgray-700">Tgl Pengiriman</label>
                            <div className="col-span-8">
                                <DatePicker
                                    value={formData.shippingDate}
                                    onChange={(e) => onChange('shippingDate', e.target.value)}
                                    className="max-w-[180px]"
                                />
                            </div>
                        </div>

                        {/* Via */}
                        <div className="grid grid-cols-12 gap-4 items-center z-10 relative">
                            <label className="col-span-4 text-sm font-medium text-warmgray-700">Pengiriman</label>
                            <div className="col-span-8 relative">
                                <input
                                    type="text"
                                    placeholder="Cari/Pilih..."
                                    className="w-full px-3 py-1.5 border border-warmgray-300 rounded text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                                <Search className="absolute right-2 top-2 h-4 w-4 text-warmgray-400" />
                            </div>
                        </div>

                        {/* FOB */}
                        <div className="grid grid-cols-12 gap-4 items-center z-10 relative">
                            <label className="col-span-4 text-sm font-medium text-warmgray-700">FOB</label>
                            <div className="col-span-8 relative">
                                <input
                                    type="text"
                                    placeholder="Cari/Pilih..."
                                    className="w-full px-3 py-1.5 border border-warmgray-300 rounded text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                                <Search className="absolute right-2 top-2 h-4 w-4 text-warmgray-400" />
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
