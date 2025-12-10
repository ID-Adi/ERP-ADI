'use client';

import { useState, useEffect } from 'react';
import { FileText, History, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface InvoiceHistoryViewProps {
    formData: any;
    totals: {
        subtotal: number;
        discountTotal: number;
        taxTotal: number;
        grandTotal: number;
    };
    invoiceId?: string; // Passed from parent
}

export default function InvoiceHistoryView({ formData, totals, invoiceId }: InvoiceHistoryViewProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [salespersonName, setSalespersonName] = useState<string>('-');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Payment History & Salesperson
    useEffect(() => {
        const fetchData = async () => {
            if (!invoiceId) return;

            setIsLoading(true);
            try {
                // 1. Fetch Receipts
                const receiptsRes = await api.get('/sales-receipts', {
                    params: { fakturId: invoiceId }
                });

                const receipts = receiptsRes.data.data.map((r: any) => ({
                    id: r.id,
                    date: new Date(r.receiptDate).toLocaleDateString('id-ID'),
                    desc: r.receiptNumber,
                    amount: r.lines.find((l: any) => l.fakturId === invoiceId)?.amount || 0
                }));
                setHistory(receipts);

                // 2. Fetch Salesperson Name if ID exists
                if (formData.salespersonId) {
                    try {
                        const spRes = await api.get(`/salespersons/${formData.salespersonId}`);
                        setSalespersonName(spRes.data.name);
                    } catch (e) {
                        // Fallback or ignore if not found
                        console.warn("Salesperson fetch failed", e);
                    }
                }

            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [invoiceId, formData.salespersonId]);

    // Calculations
    const totalPaid = history.reduce((sum, h) => sum + h.amount, 0);
    const downPayment = 0; // TODO: If DP is separate, handle it. For now assuming included in payments or 0.
    const returned = 0; // TODO: Handle returns if implemented
    const remainingBalance = totals.grandTotal - totalPaid - returned;

    // Status Logic
    const isPaid = remainingBalance <= 0 && totals.grandTotal > 0;
    const isPartial = totalPaid > 0 && remainingBalance > 0;
    const statusLabel = isPaid ? 'Lunas' : isPartial ? 'Sebagian' : 'Belum Lunas';
    const statusColor = isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200';

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
                        <span className="font-medium">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100">
                        <span className="text-warmgray-600">Retur</span>
                        <span className="font-medium">{formatCurrency(returned)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100">
                        <span className="text-warmgray-600">Piutang</span>
                        <span className="font-medium text-red-600">{formatCurrency(remainingBalance > 0 ? remainingBalance : 0)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100 items-center">
                        <span className="text-warmgray-600">Status</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded border", statusColor)}>
                            {statusLabel}
                        </span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-warmgray-100 text-xs py-1">
                        <span className="text-warmgray-600">Penjual Utama</span>
                        <span>{salespersonName}</span>
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

                {/* Stamp LUNAS - Only show if fully paid */}
                {isPaid && (
                    <div className="absolute top-20 left-10 pointer-events-none opacity-20 z-0 transform -rotate-12">
                        <div className="border-4 border-green-500 text-green-500 font-bold text-5xl px-6 py-1 rounded-lg tracking-widest">
                            LUNAS
                        </div>
                    </div>
                )}

                {/* Default Stamp BELUM LUNAS - Show if NOT paid */}
                {!isPaid && (
                    <div className="absolute top-20 left-10 pointer-events-none opacity-10 z-0 transform -rotate-12">
                        <div className="border-4 border-red-500 text-red-500 font-bold text-4xl px-6 py-1 rounded-lg tracking-widest">
                            BELUM LUNAS
                        </div>
                    </div>
                )}

                <div className="border border-warmgray-200 rounded text-sm z-10 relative bg-white/50 min-h-[100px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-warmgray-400">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Memuat riwayat...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-warmgray-400 italic">
                            Belum ada riwayat pembayaran.
                        </div>
                    ) : (
                        history.map(h => (
                            <div key={h.id} className="flex justify-between p-3 border-b border-warmgray-100 last:border-0 hover:bg-blue-50/30">
                                <div className="flex flex-col">
                                    <span className="text-blue-600 font-medium">{h.desc}</span>
                                    <span className="text-xs text-warmgray-500">{h.date}</span>
                                </div>
                                <span className="font-medium">{formatCurrency(h.amount)}</span>
                            </div>
                        ))
                    )}
                </div>

            </div>

        </div>
    );
}

