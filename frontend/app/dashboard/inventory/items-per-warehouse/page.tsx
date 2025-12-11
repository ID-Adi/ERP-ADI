'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Package, Warehouse, Calendar, X } from 'lucide-react';
import { Button, Card, Badge, PageTransition, useToast } from '@/components/ui'; // Assuming these exist
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'; // Check import path
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatNumber } from '@/lib/utils';
import api from '@/lib/api';
import { debounce } from '@/hooks/useDebounce';

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
    // Mode: 'ITEM' (Barang) or 'WAREHOUSE' (Gudang)
    const [mode, setMode] = useState<'ITEM' | 'WAREHOUSE'>('ITEM');

    // Search state
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(''); // For Warehouse filter mode

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

    // Fetch stocks function
    const fetchStocks = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { limit: 50 }; // Basic limit for now

            if (mode === 'ITEM' && itemSearchQuery) {
                params.search = itemSearchQuery;
            }

            if (mode === 'WAREHOUSE' && selectedWarehouseId) {
                params.warehouseId = selectedWarehouseId;
            }

            const res = await api.get('/items/stocks', { params });
            setStocks(res.data.data);
        } catch (error) {
            console.error('Error fetching stocks:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    }, [mode, itemSearchQuery, selectedWarehouseId, addToast]);

    // Effect to trigger fetch when dependencies change
    useEffect(() => {
        // If searching items, debounce the fetch
        if (mode === 'ITEM') {
            const timer = setTimeout(() => {
                fetchStocks();
            }, 500);
            return () => clearTimeout(timer);
        } else {
            // Immediate fetch for warehouse mode changes
            fetchStocks();
        }
    }, [fetchStocks, mode]);


    const handleRowClick = (stock: StockItem) => {
        setSelectedStock(stock);
        setShowHistoryModal(true);
    };

    return (
        <PageTransition>

            <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden">

                {/* Toolbar */}
                <div className="flex-none px-4 py-3 bg-surface-50 border-b border-surface-200">
                    <div className="flex items-center gap-2 flex-wrap">

                        {/* Mode Selector (Dropdown) */}
                        <div className="relative w-[120px]">
                            <select
                                value={mode}
                                onChange={(e) => {
                                    setMode(e.target.value as 'ITEM' | 'WAREHOUSE');
                                    setItemSearchQuery('');
                                    setSelectedWarehouseId('');
                                }}
                                className="w-full h-9 pl-3 pr-8 bg-white border border-surface-300 rounded text-sm font-medium text-warmgray-700 appearance-none focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 cursor-pointer hover:border-sidebar-border transition-colors"
                            >
                                <option value="ITEM">Barang</option>
                                <option value="WAREHOUSE">Gudang</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-warmgray-500">
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Search Input / Warehouse Selector */}
                        <div className="relative w-[280px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400" />
                            {mode === 'ITEM' ? (
                                <input
                                    type="text"
                                    placeholder="Cari/Pilih Barang"
                                    value={itemSearchQuery}
                                    onChange={(e) => setItemSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 bg-white border border-surface-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder:text-warmgray-400 transition-colors"
                                />
                            ) : (
                                <select
                                    value={selectedWarehouseId}
                                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 bg-white border border-surface-300 rounded text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 cursor-pointer hover:border-sidebar-border transition-colors"
                                >
                                    <option value="">Cari/Pilih Gudang</option>
                                    {warehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Date Picker */}
                        <div className="relative w-[130px]">
                            <input
                                type="text"
                                value="08/12/2025"
                                readOnly
                                className="w-full h-9 pl-3 pr-8 bg-white border border-surface-300 rounded text-sm text-warmgray-600 focus:outline-none cursor-default"
                            />
                            <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400" />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 ml-auto md:ml-0">
                            <Button
                                variant="outline"
                                className="h-9 w-9 p-0 flex items-center justify-center border-primary-200 text-primary-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-colors"
                                title="Refresh"
                                onClick={fetchStocks}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M21 21v-5h-5" /></svg>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-9 w-9 p-0 flex items-center justify-center border-primary-200 text-primary-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-colors"
                                title="Export"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Area (Table) */}
                <div className="flex-1 overflow-auto bg-white">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-[#546e7a] text-white text-xs uppercase sticky top-0 z-10 font-semibold tracking-wider shadow-sm">
                            <tr>
                                <th className="px-4 py-3 font-semibold border-b border-surface-200/20">Nama Barang</th>
                                <th className="px-4 py-3 font-semibold border-b border-surface-200/20">Kode Barang</th>
                                <th className="px-4 py-3 font-semibold border-b border-surface-200/20">Gudang</th>
                                <th className="px-4 py-3 font-semibold border-b border-surface-200/20 text-right">Kuantitas</th>
                                <th className="px-4 py-3 font-semibold border-b border-surface-200/20 text-right">Multi Satuan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-warmgray-500 animate-pulse">Loading data...</td></tr>
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-warmgray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Package className="h-8 w-8 text-warmgray-300" />
                                            <p>Belum ada data barang</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock, idx) => (
                                    <tr
                                        key={stock.id}
                                        onClick={() => handleRowClick(stock)}
                                        className={`hover:bg-primary-50/50 cursor-pointer transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}
                                    >
                                        <td className="px-4 py-3 text-warmgray-900 font-medium group-hover:text-primary-700">{stock.itemName}</td>
                                        <td className="px-4 py-3 text-warmgray-600">{stock.itemCode}</td>
                                        <td className="px-4 py-3 text-warmgray-600">{stock.warehouseName}</td>
                                        <td className="px-4 py-3 text-warmgray-900 font-bold text-right">{formatNumber(stock.currentStock)}</td>
                                        <td className="px-4 py-3 text-warmgray-600 text-right">{formatNumber(stock.currentStock)} {stock.uom}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* History Modal */}
                {showHistoryModal && selectedStock && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">

                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-[#1a365d] rounded-t-lg border-b border-surface-200">
                                <h3 className="text-lg font-semibold text-white">Histori per Barang per Gudang</h3>
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
                                        <input type="text" value="01/12/2024" readOnly className="px-3 py-1.5 border border-gray-300 rounded text-sm w-32 text-center" />
                                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                    </div>
                                    <span className="text-sm text-gray-500">s/d</span>
                                    <div className="relative">
                                        <input type="text" value="08/12/2025" readOnly className="px-3 py-1.5 border border-gray-300 rounded text-sm w-32 text-center" />
                                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                    </div>
                                </div>

                                {/* History Table */}
                                <div className="border border-surface-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#6b7280] text-white text-xs uppercase">
                                            <tr>
                                                <th className="px-4 py-2 border-r border-white/20">Tanggal</th>
                                                <th className="px-4 py-2 border-r border-white/20">No. Sumber #</th>
                                                <th className="px-4 py-2 border-r border-white/20">Tipe Transaksi</th>
                                                <th className="px-4 py-2 border-r border-white/20 text-right">Masuk</th>
                                                <th className="px-4 py-2 border-r border-white/20 text-right">Keluar</th>
                                                <th className="px-4 py-2 text-right">Saldo</th>
                                            </tr>
                                            <tr className="bg-white text-gray-900 font-semibold border-b border-gray-200">
                                                <td colSpan={3} className="px-4 py-2 text-right border-r">Saldo Awal</td>
                                                <td className="px-4 py-2 text-right border-r">0</td>
                                                <td className="px-4 py-2 text-right border-r">0</td>
                                                <td className="px-4 py-2 text-right">0</td>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-100">
                                            {DUMMY_HISTORY.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 border-r border-gray-100">{row.date}</td>
                                                    <td className="px-4 py-2 border-r border-gray-100">{row.ref}</td>
                                                    <td className="px-4 py-2 border-r border-gray-100">{row.type}</td>
                                                    <td className="px-4 py-2 text-right border-r border-gray-100">{row.in}</td>
                                                    <td className="px-4 py-2 text-right border-r border-gray-100">{row.out}</td>
                                                    <td className="px-4 py-2 text-right font-medium">{row.balance}</td>
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
