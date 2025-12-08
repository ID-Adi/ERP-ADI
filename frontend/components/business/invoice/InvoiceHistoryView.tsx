'use client';

import { FileText, History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface InvoiceHistoryViewProps {
    formData: any;
    totals: {
        subtotal: number;
        discountTotal: number;
        taxTotal: number;
        grandTotal: number;
    };
}

export default function InvoiceHistoryView({ formData, totals }: InvoiceHistoryViewProps) {
    // Mock Data
    const downPayment = 0;
    const returned = 0;
    const paid = 0;
    // const balance = totals.grandTotal - downPayment - paid - returned;

    const history = [
        { id: 1, date: '03/11/2025', desc: 'SI.2025.11.01023', amount: totals.grandTotal }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full bg-white rounded-lg shadow-sm border border-warmgray-200 p-6 overflow-auto">

            {/* Left: Informasi Faktur */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-primary-100 pb-2">
                    <FileText className="h-5 w-5" />
                    <h3>Informasi Faktur</h3>
                </div>

                <div className="border border-warmgray-200 rounded text-sm">
                    <div className="flex justify-between p-2 border-b border-warmgray-100">
                        <span className="text-warmgray-600">Total</span>
                        <span className="font-medium">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100">
                        <span className="text-warmgray-600">Uang Muka</span>
                        <span className="font-medium">{formatCurrency(downPayment)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100">
                        <span className="text-warmgray-600">Pembayaran</span>
                        <span className="font-medium">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100">
                        <span className="text-warmgray-600">Retur</span>
                        <span className="font-medium">{formatCurrency(returned)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100">
                        <span className="text-warmgray-600">Piutang</span>
                        <span className="font-medium">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100 items-center">
                        <span className="text-warmgray-600">Status</span>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded border border-green-200">Lunas</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100 text-xs py-1">
                        <span className="text-warmgray-600">Penjual Utama</span>
                        <span>SC - Santi</span>
                    </div>
                    <div className="flex justify-between p-2 text-xs py-1">
                        <span className="text-warmgray-600">Dicetak/email</span>
                        <span>Belum cetak/email</span>
                    </div>
                </div>
            </div>

            {/* Right: Riwayat Pembayaran */}
            <div className="space-y-4 relative">
                <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-primary-100 pb-2">
                    <History className="h-5 w-5" />
                    <h3>Riwayat Pembayaran</h3>
                </div>

                {/* Stamp LUNAS */}
                <div className="absolute top-20 left-10 pointer-events-none opacity-20 z-0 transform -rotate-12">
                    <div className="border-4 border-green-500 text-green-500 font-bold text-5xl px-6 py-1 rounded-lg tracking-widest">
                        LUNAS
                    </div>
                </div>

                <div className="border border-warmgray-200 rounded text-sm z-10 relative bg-white/50">
                    {history.map(h => (
                        <div key={h.id} className="flex justify-between p-3 border-b border-warmgray-100 last:border-0 hover:bg-blue-50/30">
                            <div className="flex flex-col">
                                <span className="text-blue-600 font-medium">{h.desc}</span>
                                <span className="text-xs text-warmgray-500">{h.date}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(h.amount)}</span>
                        </div>
                    ))}
                </div>

            </div>

        </div>
    );
}
