'use client';

import { Calendar, MapPin, Truck, AlertCircle, Search, X } from 'lucide-react';

interface InvoiceInfoViewProps {
    formData: any;
    onChange: (field: string, value: any) => void;
}

export default function InvoiceInfoView({ formData, onChange }: InvoiceInfoViewProps) {
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
                        <label className="col-span-4 text-sm font-medium text-warmgray-700">Syarat Pembayaran</label>
                        <div className="col-span-8 relative">
                            <div className="w-full pl-3 pr-8 py-2 border border-warmgray-300 rounded text-sm bg-blue-50/20 flex items-center justify-between cursor-pointer hover:border-blue-400">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                    Set Manual <X className="h-3 w-3 cursor-pointer hover:text-blue-900" />
                                </span>
                                <Search className="h-4 w-4 text-warmgray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700">Jatuh Tempo</label>
                        <div className="col-span-8 relative">
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => onChange('dueDate', e.target.value)}
                                className="w-full pl-3 pr-8 py-2 border border-warmgray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                            />
                            <Calendar className="absolute right-2 top-2.5 h-4 w-4 text-warmgray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* PO Number */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700">No. PO</label>
                        <div className="col-span-8">
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-12 gap-4 items-start">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700 pt-2">Alamat</label>
                        <div className="col-span-8 flex gap-2">
                            <button className="p-2 border border-blue-300 rounded bg-white text-blue-600 hover:bg-blue-50 h-min">
                                <MapPin className="h-4 w-4" />
                            </button>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none font-mono"
                                value="DESA TEWAH
KUALA KURUN KALIMANTAN TENGAH
INDONESIA" // Dummy default
                            />
                        </div>
                    </div>

                    {/* Branch */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700">Cabang <span className="text-red-500">*</span></label>
                        <div className="col-span-8 relative">
                            <div className="w-full pl-3 pr-8 py-2 border border-warmgray-300 rounded text-sm bg-white flex items-center justify-between cursor-pointer">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                    CABANG PALANGKARAYA <X className="h-3 w-3 cursor-pointer" />
                                </span>
                                <Search className="h-4 w-4 text-warmgray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-12 gap-4 items-start">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700 pt-2">Keterangan</label>
                        <div className="col-span-8">
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none"
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
                        <FileText className="h-5 w-5" /> {/* Imported via InvoiceItemsView, define it again if needed or use AlertCircle */}
                        <h3>Info Pajak</h3>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                        <label className="col-span-4 text-sm font-medium text-warmgray-700">Pajak (i)</label>
                        <div className="col-span-8 flex gap-6">
                            <label className="flex items-center gap-2 text-sm text-warmgray-700 cursor-pointer">
                                <input type="checkbox" className="rounded border-warmgray-300 text-primary-600 focus:ring-primary-500" />
                                <span>Kena Pajak</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-warmgray-700 cursor-pointer">
                                <input type="checkbox" className="rounded border-warmgray-300 text-primary-600 focus:ring-primary-500" />
                                <span>Total termasuk Pajak</span>
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
                        <div className="absolute top-10 left-0 pointer-events-none opacity-20 z-0 transform -rotate-12 scale-75 origin-top-left">
                            <div className="border-4 border-green-500 text-green-500 font-bold text-4xl px-4 py-1 rounded-lg tracking-widest">
                                LUNAS
                            </div>
                        </div>

                        {/* Shipping Date */}
                        <div className="grid grid-cols-12 gap-4 items-center z-10 relative">
                            <label className="col-span-4 text-sm font-medium text-warmgray-700">Tgl Pengiriman</label>
                            <div className="col-span-8 relative">
                                <input
                                    type="date"
                                    className="w-40 px-3 py-1.5 border border-warmgray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
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
                                    className="w-full px-3 py-1.5 border border-warmgray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
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
                                    className="w-full px-3 py-1.5 border border-warmgray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                                />
                                <Search className="absolute right-2 top-2 h-4 w-4 text-warmgray-400" />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Additional Info Header (Empty content in ref image) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-primary-100 pb-2">
                        <AlertCircle className="h-5 w-5" />
                        <h3>Info Tambahan</h3>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Helper icons
function FileText(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}
