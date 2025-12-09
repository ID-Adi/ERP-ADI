'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Printer,
    Download,
    ZoomIn,
    ZoomOut,
    ArrowLeft,
    RefreshCw
} from 'lucide-react';
import { Button, PageTransition, Skeleton, useToast } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { showError } from '@/lib/swal';

// --- Types ---
interface BalanceSheetItem {
    code: string;
    name: string;
    amount: number;
}

interface BalanceSheetData {
    assets: {
        current: BalanceSheetItem[];
        fixed: BalanceSheetItem[];
        total: number;
    };
    liabilities: {
        current: BalanceSheetItem[];
        longTerm: BalanceSheetItem[];
        total: number;
    };
    equity: {
        items: BalanceSheetItem[];
        total: number;
    };
    summary: {
        totalAssets: number;
        totalLiabilitiesAndEquity: number;
        isBalanced: boolean;
    };
}

// Types for Print Rows
type RowType = 'SECTION_HEADER' | 'SUB_HEADER' | 'ITEM' | 'SUBTOTAL' | 'TOTAL' | 'SPACER' | 'GRAND_TOTAL';

interface PrintRow {
    id: string;
    type: RowType;
    label: string;
    amount?: number;
    indent?: boolean;
    bold?: boolean;
    isNegative?: boolean;
}

export default function BalanceSheetPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BalanceSheetData | null>(null);
    const [zoom, setZoom] = useState(0.8);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Data Fetching ---
    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/balance-sheet', {
                params: { endDate: date }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
            addToast({ type: 'error', title: 'Gagal', message: 'Gagal mengambil data neraca' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [date]);

    const handlePrint = () => {
        window.print();
    };

    const handleExporPDF = () => {
        addToast({ type: 'info', title: 'Info', message: 'Fitur Export PDF (Puppeteer) akan segera hadir' });
    };

    // --- Flatten Data Logic ---
    const flattenedRows = useMemo(() => {
        if (!data) return [];
        const rows: PrintRow[] = [];
        let idCounter = 0;
        const genId = () => `row-${idCounter++}`;
        const addSpace = () => rows.push({ id: genId(), type: 'SPACER', label: '' });

        // === ASSETS ===
        rows.push({ id: genId(), type: 'SECTION_HEADER', label: 'ASET (ASSETS)' });

        // Current Assets
        rows.push({ id: genId(), type: 'SUB_HEADER', label: 'Aset Lancar' });
        if (data.assets.current.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            data.assets.current.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: item.amount, indent: true });
            });
        }
        addSpace();

        // Fixed Assets
        rows.push({ id: genId(), type: 'SUB_HEADER', label: 'Aset Tetap' });
        if (data.assets.fixed.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            data.assets.fixed.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: item.amount, indent: true }); // Contra assets handled by backend sent as negative? Controller logic says " * -1", so yes.
            });
        }
        addSpace();

        // Total Assets
        rows.push({ id: genId(), type: 'TOTAL', label: 'TOTAL ASET', amount: data.summary.totalAssets });
        addSpace();
        addSpace();

        // === LIABILITIES ===
        rows.push({ id: genId(), type: 'SECTION_HEADER', label: 'KEWAJIBAN (LIABILITIES)' });

        // Current Liabilities
        rows.push({ id: genId(), type: 'SUB_HEADER', label: 'Kewajiban Jangka Pendek' });
        if (data.liabilities.current.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            data.liabilities.current.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: item.amount, indent: true });
            });
        }
        addSpace();

        // Long Term Liabilities
        rows.push({ id: genId(), type: 'SUB_HEADER', label: 'Kewajiban Jangka Panjang' });
        if (data.liabilities.longTerm.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            data.liabilities.longTerm.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: item.amount, indent: true });
            });
        }

        rows.push({ id: genId(), type: 'SUBTOTAL', label: 'Total Kewajiban', amount: data.liabilities.total });
        addSpace();

        // === EQUITY ===
        rows.push({ id: genId(), type: 'SECTION_HEADER', label: 'MODAL (EQUITY)' });
        if (data.equity.items.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            data.equity.items.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: item.amount, indent: true });
            });
        }
        rows.push({ id: genId(), type: 'SUBTOTAL', label: 'Total Modal', amount: data.equity.total });
        addSpace();

        // === GRAND TOTAL ===
        rows.push({
            id: genId(),
            type: 'GRAND_TOTAL',
            label: 'TOTAL KEWAJIBAN & MODAL',
            amount: data.summary.totalLiabilitiesAndEquity
        });

        // Balance Check Message
        if (!data.summary.isBalanced) {
            addSpace();
            rows.push({
                id: genId(),
                type: 'ITEM',
                label: `* TIDAK BALANCE (Selisih: ${formatCurrency(data.summary.totalAssets - data.summary.totalLiabilitiesAndEquity)})`,
                isNegative: true,
                bold: true
            });
        }

        return rows;
    }, [data]);

    // --- Chunking Logic ---
    const ROWS_PER_PAGE = 22;

    const chunkArray = <T,>(array: T[], size: number): T[][] => {
        const chunked: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunked.push(array.slice(i, i + size));
        }
        return chunked;
    };

    const pages = useMemo(() => {
        return chunkArray(flattenedRows, ROWS_PER_PAGE);
    }, [flattenedRows]);

    return (
        <PageTransition>
            <div className="flex flex-col h-screen bg-gray-200 overflow-hidden font-sans">
                {/* TOOLBAR */}
                <div className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-4 shrink-0 z-50 shadow-sm print:hidden">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Button>
                        <div className="h-6 w-px bg-gray-300 mx-2"></div>

                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md border border-gray-200">
                            <span className="text-gray-500 pl-2 text-xs">Per Tanggal:</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent border-none text-xs w-28 focus:ring-0"
                            />
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={fetchReport}>
                                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 rounded-md border border-gray-200 p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
                            >
                                <ZoomOut className="h-3 w-3" />
                            </Button>
                            <span className="text-xs w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
                            >
                                <ZoomIn className="h-3 w-3" />
                            </Button>
                        </div>

                        <Button variant="outline" className="gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                        <Button variant="primary" className="gap-2" onClick={handleExporPDF}>
                            <Download className="h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                </div>

                {/* SCROLLABLE VIEWER AREA */}
                <div className="flex-1 overflow-auto bg-gray-500 p-8 relative flex justify-center">
                    <div
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                            paddingBottom: '50px'
                        }}
                    >
                        {loading ? (
                            <div className="bg-white shadow-2xl p-8 space-y-8" style={{ width: '210mm', height: '297mm' }}>
                                <Skeleton className="h-24 w-full" />
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-1/3" />
                                    <Skeleton className="h-40 w-full" />
                                </div>
                            </div>
                        ) : data ? (
                            pages.map((pageRows, pageIndex) => (
                                <div
                                    key={pageIndex}
                                    className="bg-white shadow-2xl mb-8 relative flex flex-col page-break"
                                    style={{
                                        width: '210mm',
                                        minHeight: '297mm',
                                        padding: '15mm 20mm',
                                    }}
                                >
                                    {/* HEADER */}
                                    <div className="text-center mb-6">
                                        <h1 className="text-xl font-bold text-gray-900 uppercase">CV ANANDA RAYA UTAMA</h1>
                                        <h2 className="text-2xl font-bold text-indigo-700 my-2">Neraca (Standar)</h2>
                                        <p className="text-sm font-medium text-gray-900">
                                            Per Tanggal {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <div className="text-xs text-right mt-2 italic text-gray-500">
                                            Halaman {pageIndex + 1} dari {pages.length}
                                        </div>
                                        <div className="border-b-2 border-gray-800 mt-1 mb-1"></div>
                                        <div className="border-b border-gray-800 mb-2"></div>
                                    </div>

                                    {/* CONTENT */}
                                    <div className="flex-1 font-serif text-sm leading-relaxed text-gray-900">
                                        <div className="grid grid-cols-2 gap-4 mb-2 font-bold text-blue-800 border-b border-gray-400 pb-1 text-xs uppercase">
                                            <span>Deskripsi</span>
                                            <span className="text-right">Total (IDR)</span>
                                        </div>

                                        <table className="w-full">
                                            <tbody>
                                                {pageRows.map((row) => (
                                                    <tr key={row.id} className="group">
                                                        <td className={`py-1 pr-4 
                                                            ${row.type === 'SECTION_HEADER' ? 'font-bold uppercase text-base text-gray-800 pt-4' : ''}
                                                            ${row.type === 'SUB_HEADER' ? 'font-bold text-xs uppercase text-gray-600 pt-2 pl-2' : ''}
                                                            ${row.type === 'SUBTOTAL' ? 'font-bold border-t border-gray-800 pt-2 pl-2' : ''}
                                                            ${row.type === 'TOTAL' ? 'font-bold text-base pt-3 border-t-2 border-gray-400' : ''}
                                                            ${row.type === 'GRAND_TOTAL' ? 'font-bold text-lg pt-4 pb-2 border-t-2 border-gray-900 mt-2' : ''}
                                                            ${row.indent ? 'pl-6 text-gray-700' : ''}
                                                            ${row.bold ? 'font-bold' : ''}
                                                            ${row.isNegative ? 'text-red-600' : ''}
                                                        `}>
                                                            {row.label}
                                                        </td>
                                                        <td className={`py-1 text-right font-mono
                                                             ${row.type === 'SUBTOTAL' ? 'font-bold border-t border-gray-800 pt-2' : ''}
                                                             ${row.type === 'TOTAL' ? 'font-bold text-base pt-3 border-t-2 border-gray-400' : ''}
                                                             ${row.type === 'GRAND_TOTAL' ? 'font-bold text-lg pt-4 pb-2 border-t-2 border-gray-900 mt-2' : ''}
                                                             ${row.isNegative ? 'text-red-600' : ''}
                                                        `}>
                                                            {row.amount !== undefined && !['SECTION_HEADER', 'SUB_HEADER'].includes(row.type) ? formatCurrency(row.amount) : ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white shadow-2xl p-20 text-center italic text-gray-400" style={{ width: '210mm', height: '297mm' }}>
                                Data laporan tidak tersedia.
                            </div>
                        )}
                    </div>
                </div>

                <style jsx global>{`
                    @media print {
                        @page { size: A4; margin: 0; }
                        body { background: white; }
                        .print\\:hidden, nav, aside, header { display: none !important; }
                        .overflow-auto { overflow: visible !important; background: white !important; padding: 0 !important; }
                        .page-break {
                            box-shadow: none !important; margin: 0 !important;
                            width: 100% !important; height: 297mm !important;
                            page-break-after: always !important; break-after: always !important;
                            padding: 10mm !important;
                        }
                        .page-break:last-child { page-break-after: avoid !important; break-after: avoid !important; }
                    }
                `}</style>
            </div>
        </PageTransition>
    );
}
