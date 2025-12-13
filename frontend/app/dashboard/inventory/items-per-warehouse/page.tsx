'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Package, X, Plus, RefreshCw, Download, Printer } from 'lucide-react';
import { Button, Card, Badge, PageTransition, useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { debounce, useDebounce } from '@/hooks/useDebounce';

// --- Types ---
interface StockItem {
    id: string;
    itemId: string;
    itemName: string;
    itemCode: string;
    uom: string;
    warehouseId: string;
    warehouseName: string;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    minStock: number;
    updatedAt: string;
}

interface WarehouseOption {
    id: string;
    name: string;
    code: string;
}

// Dummy History Data for Modal (as per request for specific UI)
const DUMMY_HISTORY = [
    { date: '31/01/2025', ref: 'IA.2025.01.00013', type: 'Penyesuaian Persediaan', in: 37, out: 0, balance: 37 },
    { date: '24/05/2025', ref: 'IA.2025.05.00031', type: 'Penyesuaian Persediaan', in: 4, out: 0, balance: 41 },
    { date: '27/10/2025', ref: 'IA.2025.10.00072', type: 'Penyesuaian Persediaan', in: 0, out: 2, balance: 39 },
];

export default function ItemsPerWarehousePage() {
    const { addToast } = useToast();

    // Search state (Daftar Pattern)
    const [searchInput, setSearchInput] = useState(''); // User input (immediate)
    const searchQuery = useDebounce(searchInput, 500); // Debounced search query

    // Data state
    const [stocks, setStocks] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);

    // Modal State
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Initial load: Fetch Warehouses (needed for dropdown/filter)
    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await api.get('/items/warehouses/list');
                setWarehouses(res.data.data);
            } catch (err) {
                console.error('Failed to fetch warehouses', err);
            }
        };
        fetchWarehouses();
    }, []);

    // Fetch stocks function (Daftar Pattern)
    const fetchStocks = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 }; // Increased limit for better initial load

            if (searchQuery) {
                params.search = searchQuery;
            }

            const res = await api.get('/items/stocks', { params });
            const data = res.data.data || res.data || [];
            if (Array.isArray(data)) {
                setStocks(data);
            } else {
                setStocks([]);
            }
        } catch (error) {
            console.error('Error fetching stocks:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to load data' });
            setStocks([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, addToast]);

    // Effect to fetch when searchQuery changes (debounce handled by useDebounce hook)
    useEffect(() => {
        fetchStocks();
    }, [fetchStocks]);


    const handleRowClick = (stock: StockItem) => {
        setSelectedStock(stock);
        setShowHistoryModal(true);
    };

    return (
        <PageTransition>

            <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-lg shadow-sm border border-warmgray-200 overflow-hidden">

                {/* Toolbar - Daftar Pattern */}
                <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                    {/* LEFT: Add + Refresh buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                            title="Tambah Item Baru"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                        <button
                            onClick={fetchStocks}
                            className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded transition-colors bg-white"
                            title="Refresh Data"
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </button>
                    </div>

                    {/* RIGHT: Export + Search + Count */}
                    <div className="flex items-center gap-2">
                        {/* Action Buttons Group (Export/Print) */}
                        <div className="flex items-center border border-surface-300 rounded bg-white">
                            <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 border-r border-surface-200 rounded-l transition-colors" title="Download">
                                <Download className="h-4 w-4" />
                            </button>
                            <button className="flex items-center justify-center w-8 h-8 hover:bg-surface-100 text-warmgray-600 rounded-r transition-colors" title="Cetak">
                                <Printer className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center border border-surface-300 rounded overflow-hidden bg-white">
                            <span className="px-3 py-1.5 text-sm text-warmgray-500">Cari...</span>
                            <input
                                type="text"
                                placeholder=""
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-40 px-2 py-1.5 text-sm bg-white border-l border-surface-200 focus:outline-none focus:ring-0 placeholder:text-warmgray-400"
                            />
                        </div>

                        {/* Item Count */}
                        <span className="text-sm text-warmgray-600 font-medium min-w-[50px] text-right">
                            {stocks.length.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Content Area (Table) */}
                <div className="flex-1 overflow-auto bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 font-medium">No</th>
                                <th className="px-4 py-2 font-medium">Nama Barang & Jasa</th>
                                <th className="px-4 py-2 font-medium">Kode</th>
                                <th className="px-4 py-2 font-medium">Gudang</th>
                                <th className="px-4 py-2 font-medium text-right">Qty</th>
                                <th className="px-4 py-2 font-medium">Satuan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse bg-white">
                                        <td colSpan={6} className="px-4 py-3">
                                            <div className="h-4 bg-surface-200 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-warmgray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Package className="h-12 w-12 text-warmgray-300 mb-3" />
                                            <p>Tidak ada data barang</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock, index) => (
                                    <tr
                                        key={stock.id}
                                        onClick={() => handleRowClick(stock)}
                                        className={cn(
                                            "hover:bg-primary-50 transition-colors cursor-pointer group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                        )}
                                    >
                                        <td className="px-4 py-2 font-semibold text-warmgray-600 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-2 font-medium text-warmgray-900">{stock.itemName}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{stock.itemCode}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{stock.warehouseName}</td>
                                        <td className="px-4 py-2 text-right text-warmgray-600">{formatNumber(stock.currentStock)}</td>
                                        <td className="px-4 py-2 text-warmgray-600">{stock.uom}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* History Modal */}
                {showHistoryModal && selectedStock && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">

                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-warmgray-900 rounded-t-lg border-b border-warmgray-200">
                                <h3 className="text-lg font-semibold text-white">Rincian Stock & History</h3>
                                <button onClick={() => setShowHistoryModal(false)} className="text-white/80 hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto">
                                <div className="mb-4 text-sm text-warmgray-600">
                                    Displaying history for <span className="font-semibold text-warmgray-900">{selectedStock.itemName}</span> in <span className="font-semibold text-warmgray-900">{selectedStock.warehouseName}</span>
                                </div>

                                {/* Date Range dummy filter */}
                                <div className="flex items-center gap-2 mb-4 justify-center">
                                    <div className="relative">
                                        <input type="text" value="01/12/2024" readOnly className="px-3 py-1.5 border border-warmgray-300 rounded text-sm w-32 text-center" />
                                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-warmgray-400" />
                                    </div>
                                    <span className="text-sm text-warmgray-500">s/d</span>
                                    <div className="relative">
                                        <input type="text" value="08/12/2025" readOnly className="px-3 py-1.5 border border-warmgray-300 rounded text-sm w-32 text-center" />
                                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-warmgray-400" />
                                    </div>
                                </div>

                                {/* History Table */}
                                <div className="border border-warmgray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-warmgray-50 text-warmgray-600 font-semibold border-b border-warmgray-200">
                                            <tr>
                                                <th className="px-4 py-2 border-r border-warmgray-200">Tanggal</th>
                                                <th className="px-4 py-2 border-r border-warmgray-200">No. Sumber</th>
                                                <th className="px-4 py-2 border-r border-warmgray-200">Tipe Transaksi</th>
                                                <th className="px-4 py-2 border-r border-warmgray-200 text-right">Masuk</th>
                                                <th className="px-4 py-2 border-r border-warmgray-200 text-right">Keluar</th>
                                                <th className="px-4 py-2 text-right">Saldo</th>
                                            </tr>
                                            <tr className="bg-warmgray-100 text-warmgray-900 font-semibold border-b border-warmgray-200">
                                                <td colSpan={3} className="px-4 py-2 text-right border-r border-warmgray-200">Saldo Awal</td>
                                                <td className="px-4 py-2 text-right border-r border-warmgray-200">0</td>
                                                <td className="px-4 py-2 text-right border-r border-warmgray-200">0</td>
                                                <td className="px-4 py-2 text-right">0</td>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-warmgray-100">
                                            {DUMMY_HISTORY.map((row, idx) => (
                                                <tr key={idx} className={`hover:bg-primary-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafb]'}`}>
                                                    <td className="px-4 py-2 border-r border-warmgray-100 text-warmgray-600">{row.date}</td>
                                                    <td className="px-4 py-2 border-r border-warmgray-100 text-warmgray-600">{row.ref}</td>
                                                    <td className="px-4 py-2 border-r border-warmgray-100 text-warmgray-600">{row.type}</td>
                                                    <td className="px-4 py-2 text-right border-r border-warmgray-100 text-warmgray-900 font-medium">{row.in}</td>
                                                    <td className="px-4 py-2 text-right border-r border-warmgray-100 text-warmgray-900 font-medium">{row.out}</td>
                                                    <td className="px-4 py-2 text-right text-warmgray-900 font-semibold">{row.balance}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
}
