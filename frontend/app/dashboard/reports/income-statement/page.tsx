'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
interface AccountItem {
    id: string;
    code: string;
    name: string;
    type: string;
    amount: number;
}

interface IncomeStatementData {
    period: {
        from: string;
        to: string;
    };
    sections: {
        revenue: { items: AccountItem[]; total: number };
        cogs: { items: AccountItem[]; total: number };
        grossProfit: number;
        expenses: { items: AccountItem[]; total: number };
        operatingIncome: number;
        otherItems: {
            items: AccountItem[];
            totalIncome: number;
            totalExpense: number;
            net: number;
        };
        netIncome: number;
    };
}

// Types for Print Rows
type RowType = 'SECTION_HEADER' | 'ITEM' | 'SUBTOTAL' | 'TOTAL' | 'SPACER' | 'GRAND_TOTAL';

interface PrintRow {
    id: string;
    type: RowType;
    label: string;
    amount?: number;
    indent?: boolean;
    bold?: boolean;
    isNegative?: boolean; // For styling red text
}

export default function IncomeStatementPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<IncomeStatementData | null>(null);
    const [zoom, setZoom] = useState(0.8); // Default zoom slightly smaller to see full page

    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dateRange, setDateRange] = useState({
        from: firstDay.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
    });

    // --- Data Fetching ---
    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/income-statement', {
                params: {
                    startDate: dateRange.from,
                    endDate: dateRange.to,
                },
            });
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching income statement:', error);
            addToast({ type: 'error', title: 'Gagal', message: 'Gagal mengambil data laporan laba rugi' });
        } finally {
            setLoading(false);
        }
    }, [dateRange, addToast]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

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

        // 1. Revenue
        rows.push({ id: genId(), type: 'SECTION_HEADER', label: 'PENDAPATAN' });
        if (data.sections.revenue.items.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            data.sections.revenue.items.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: Math.abs(item.amount), indent: true });
            });
        }
        rows.push({ id: genId(), type: 'SUBTOTAL', label: 'Jumlah Pendapatan', amount: data.sections.revenue.total });
        addSpace();

        // 2. COGS
        rows.push({ id: genId(), type: 'SECTION_HEADER', label: 'BEBAN POKOK PENJUALAN' });
        if (data.sections.cogs.items.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            data.sections.cogs.items.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: Math.abs(item.amount), indent: true });
            });
        }
        rows.push({ id: genId(), type: 'SUBTOTAL', label: 'Jumlah Beban Pokok Penjualan', amount: data.sections.cogs.total });
        addSpace();

        // 3. Gross Profit
        rows.push({ id: genId(), type: 'TOTAL', label: 'LABA KOTOR', amount: data.sections.grossProfit });
        addSpace();

        // 4. Operating Expenses
        rows.push({ id: genId(), type: 'SECTION_HEADER', label: 'BEBAN OPERASIONAL' });
        if (data.sections.expenses.items.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            data.sections.expenses.items.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: Math.abs(item.amount), indent: true });
            });
        }
        rows.push({ id: genId(), type: 'SUBTOTAL', label: 'Jumlah Beban Operasional', amount: data.sections.expenses.total });
        addSpace();

        // 5. Operating Income
        rows.push({ id: genId(), type: 'TOTAL', label: 'LABA OPERASIONAL', amount: data.sections.operatingIncome });
        addSpace();

        // 6. Other Items
        const otherIncome = data.sections.otherItems.items.filter(i => i.type === 'OTHER_INCOME');
        rows.push({ id: genId(), type: 'SECTION_HEADER', label: 'PENDAPATAN LAINNYA' });
        if (otherIncome.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            otherIncome.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: Math.abs(item.amount), indent: true });
            });
        }
        rows.push({ id: genId(), type: 'SUBTOTAL', label: 'Jumlah Pendapatan Lainnya', amount: data.sections.otherItems.totalIncome });
        addSpace();

        const otherExpense = data.sections.otherItems.items.filter(i => i.type === 'OTHER_EXPENSE');
        rows.push({ id: genId(), type: 'SECTION_HEADER', label: 'BEBAN LAINNYA' });
        if (otherExpense.length === 0) {
            rows.push({ id: genId(), type: 'ITEM', label: 'Tidak ada data', indent: true });
        } else {
            otherExpense.forEach(item => {
                rows.push({ id: genId(), type: 'ITEM', label: item.name, amount: Math.abs(item.amount), indent: true });
            });
        }
        rows.push({ id: genId(), type: 'SUBTOTAL', label: 'Jumlah Beban Lainnya', amount: data.sections.otherItems.totalExpense });
        addSpace();

        // 7. Net Income
        rows.push({
            id: genId(),
            type: 'GRAND_TOTAL',
            label: 'LABA BERSIH',
            amount: data.sections.netIncome,
            isNegative: data.sections.netIncome < 0
        });

        return rows;
    }, [data]);

    // --- Chunking Logic ---
    const ROWS_PER_PAGE = 22; // Adjust based on A4 height and Header height

    // Helper to chunk array
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

                        {/* Date Filter */}
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md border border-gray-200">
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="bg-transparent border-none text-xs w-28 focus:ring-0"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="bg-transparent border-none text-xs w-28 focus:ring-0"
                            />
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={fetchReport}>
                                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
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
                                        minHeight: '297mm', // A4 Height
                                        padding: '15mm 20mm',
                                    }}
                                >
                                    {/* HEADER (Repeats on every page) */}
                                    <div className="text-center mb-6">
                                        <h1 className="text-xl font-bold text-gray-900 uppercase">CV ANANDA RAYA UTAMA</h1>
                                        <h2 className="text-2xl font-bold text-red-600 my-2">Laba/Rugi (Standar)</h2>
                                        <p className="text-sm font-medium text-gray-900">
                                            Dari {new Date(data.period.from).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} s/d {new Date(data.period.to).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <div className="text-xs text-right mt-2 italic text-gray-500">
                                            Halaman {pageIndex + 1} dari {pages.length}
                                        </div>
                                        <div className="border-b-2 border-gray-800 mt-1 mb-1"></div>
                                        <div className="border-b border-gray-800 mb-2"></div>
                                    </div>

                                    {/* CONTENT */}
                                    <div className="flex-1 font-serif text-sm leading-relaxed text-gray-900">
                                        {/* Column Headers only on first page if desired, or every page. User image implies headers (Deskripsi / 1-9 Des 2025) might be needed. Let's add simple column headers */}
                                        <div className="grid grid-cols-2 gap-4 mb-2 font-bold text-blue-800 border-b border-gray-400 pb-1 text-xs uppercase">
                                            <span>Deskripsi</span>
                                            <span className="text-right">Total (IDR)</span>
                                        </div>

                                        <table className="w-full">
                                            <tbody>
                                                {pageRows.map((row) => (
                                                    <tr key={row.id} className="group">
                                                        <td className={`py-1 pr-4
                                                            ${row.type === 'SECTION_HEADER' ? 'font-bold uppercase text-xs pt-3' : ''}
                                                            ${row.type === 'SUBTOTAL' ? 'font-bold border-t border-gray-800 pt-2' : ''}
                                                            ${row.type === 'TOTAL' ? 'font-bold text-base pt-3' : ''}
                                                            ${row.type === 'GRAND_TOTAL' ? 'font-bold text-lg pt-4 pb-2' : ''}
                                                            ${row.indent ? 'pl-4 text-gray-700' : ''}
                                                        `}>
                                                            {row.label}
                                                        </td>
                                                        <td className={`py-1 text-right font-mono
                                                             ${row.type === 'SECTION_HEADER' || row.type === 'SPACER' ? '' : ''}
                                                             ${row.type === 'SUBTOTAL' ? 'font-bold border-t border-gray-800 pt-2' : ''}
                                                             ${row.type === 'TOTAL' ? 'font-bold text-base pt-3' : ''}
                                                             ${row.type === 'GRAND_TOTAL' ? 'font-bold text-lg pt-4 pb-2 border-t-2 border-gray-900 mt-2' : ''}
                                                             ${row.isNegative ? 'text-red-600' : ''}
                                                        `}>
                                                            {row.amount !== undefined && row.type !== 'SECTION_HEADER' ? formatCurrency(row.amount) : ''}
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

                {/* Print Styles */}
                <style jsx global>{`
                    @media print {
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        body {
                            background: white;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                        nav, aside, header {
                            display: none !important;
                        }
                        .overflow-auto {
                            overflow: visible !important;
                            background: white !important;
                            padding: 0 !important;
                        }
                        .page-break {
                            box-shadow: none !important;
                            margin: 0 !important;
                            width: 100% !important;
                            height: 297mm !important;
                            page-break-after: always !important;
                            break-after: always !important;
                            padding: 10mm !important;
                        }
                        .page-break:last-child {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                    }
                `}</style>
            </div>
        </PageTransition>
    );
}
