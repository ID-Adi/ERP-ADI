import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Trash2, MoreHorizontal, Paperclip, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import ProductDetailModal from './ProductDetailModal';
import api from '@/lib/api';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { debounce } from '@/hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

// Shared LineItem interface (should be centralized ideally)
interface LineItem {
    id: string;
    itemId?: string; // Database ID of the item (for backend)
    itemCode: string;
    description: string;
    notes?: string;
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
    warehouseName?: string;
    salespersonId?: string;
    salespersonName?: string;
}

interface InvoiceItemsViewProps {
    items: LineItem[];
    onItemsChange: (items: LineItem[]) => void;
    readOnly?: boolean;
    status?: 'unsaved' | 'unpaid' | 'paid';
}

export default function InvoiceItemsView({ items, onItemsChange, readOnly = false, status = 'unsaved' }: InvoiceItemsViewProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LineItem | undefined>(undefined);

    // Product Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Pagination & Virtualization State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isNextPageLoading, setIsNextPageLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const LIMIT = 20;

    const cache = useRef(new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: 70
    })).current;

    // Fetch Products
    const loadProducts = useCallback(async (currentPage: number, query: string, append: boolean = false) => {
        try {
            if (!append) setIsInitialLoading(true);
            setIsNextPageLoading(true);
            const response = await api.get('/items/list', {
                params: {
                    page: currentPage,
                    limit: LIMIT,
                    search: query,
                    status: 'Aktif'
                }
            });

            const newProducts = response.data.data || [];
            const meta = response.data.meta;

            if (append) {
                setProducts(prev => [...prev, ...newProducts]);
            } else {
                setProducts(newProducts);
            }

            setTotalCount(meta.total);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsNextPageLoading(false);
            if (!append) setIsInitialLoading(false);
        }
    }, []);

    // Debounced Search
    const debouncedSearch = useRef(
        debounce((query: string) => {
            setPage(1);
            loadProducts(1, query, false);
        }, 500)
    ).current;

    useEffect(() => {
        debouncedSearch(searchQuery);
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchQuery, debouncedSearch]);

    // Handle clicking outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to parse localized numbers
    const parseNumber = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const clean = value.replace(/\./g, '').replace(',', '.');
            const num = parseFloat(clean);
            return isNaN(num) ? 0 : num;
        }
        return 0;
    };

    const handleAddItem = (product: any) => {
        const sellPrice = parseNumber(product.sellPrice);
        const newItem: LineItem = {
            id: Date.now().toString(),
            itemId: product.id,
            itemCode: product.code,
            description: product.name,
            quantity: 1,
            unit: product.unit || 'PCS',
            unitPrice: sellPrice,
            discountPercent: 0,
            discountAmount: 0,
            taxPercent: 11,
            lineAmount: sellPrice,
            taxAmount: sellPrice * 0.11,
            totalAmount: sellPrice * 1.11,
        };
        setEditingItem(newItem);
        setModalOpen(true);
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleEditItem = (item: LineItem) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleSaveItem = (item: LineItem) => {
        const existingItemIndex = items.findIndex(i => i.id === item.id);

        if (existingItemIndex >= 0) {
            const newItems = [...items];
            newItems[existingItemIndex] = item;
            onItemsChange(newItems);
        } else {
            onItemsChange([...items, item]);
        }
        setModalOpen(false);
        setEditingItem(undefined);
    };

    const handleDeleteItem = (id: string) => {
        onItemsChange(items.filter(i => i.id !== id));
        setModalOpen(false);
    };

    // Virtualization Handlers
    const isRowLoaded = ({ index }: { index: number }) => {
        return !!products[index];
    };

    const loadMoreRows = ({ startIndex, stopIndex }: { startIndex: number, stopIndex: number }) => {
        if (isNextPageLoading) return Promise.resolve();
        const nextPage = page + 1;
        setPage(nextPage);
        return loadProducts(nextPage, searchQuery, true);
    };

    const rowRenderer = ({ index, key, parent, style }: any) => {
        const product = products[index];

        if (!product) {
            return (
                <div key={key} style={style} className="px-4 py-3 text-center text-sm text-warmgray-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                    <span>Loading more...</span>
                </div>
            );
        }

        return (
            <CellMeasurer
                cache={cache}
                columnIndex={0}
                key={key}
                parent={parent}
                rowIndex={index}
            >
                <div
                    style={style}
                    onClick={() => handleAddItem(product)}
                    className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-warmgray-50 last:border-0 transition-colors"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm font-medium text-warmgray-900">{product.name}</div>
                            <div className="text-xs text-warmgray-500">{product.code}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-primary-600">
                                {formatCurrency(product.sellPrice)}
                            </div>
                            <div className="text-xs text-warmgray-500">
                                Stok: {product.sellableStock !== undefined ? product.sellableStock : '-'} {product.unit}
                            </div>
                        </div>
                    </div>
                </div>
            </CellMeasurer>
        );
    };

    // Table Search State
    const [tableSearch, setTableSearch] = useState('');

    // Filter Items based on Table Search
    const filteredItems = items.filter(item =>
        item.description.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(tableSearch.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-warmgray-200 overflow-hidden relative">
            {/* Search Bar */}
            <div className="p-2 border-b border-warmgray-200 flex items-center gap-2 bg-warmgray-50/50">
                <div className="relative flex-1 max-w-xl" ref={searchContainerRef}>
                    <input
                        type="text"
                        placeholder="Cari/Pilih Barang & Jasa..."
                        className="w-full pl-3 pr-8 py-1.5 border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400 pointer-events-none" />

                    {/* Product Dropdown */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-50 w-full mt-1 bg-white border border-warmgray-300 rounded-md shadow-lg h-80 overflow-hidden"
                            >
                                {isInitialLoading ? (
                                    <div className="flex flex-col">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="px-4 py-3 border-b border-warmgray-50">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="h-4 w-48 rounded animate-shimmer mb-2"></div>
                                                        <div className="h-3 w-24 rounded animate-shimmer"></div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="h-4 w-24 rounded animate-shimmer"></div>
                                                        <div className="h-3 w-16 rounded animate-shimmer"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : products.length > 0 ? (
                                    <InfiniteLoader
                                        isRowLoaded={isRowLoaded}
                                        loadMoreRows={loadMoreRows}
                                        rowCount={totalCount}
                                        threshold={5}
                                    >
                                        {({ onRowsRendered, registerChild }) => (
                                            <AutoSizer>
                                                {({ width, height }) => (
                                                    <List
                                                        width={width}
                                                        height={height}
                                                        onRowsRendered={onRowsRendered}
                                                        ref={registerChild}
                                                        rowCount={totalCount}
                                                        rowHeight={cache.rowHeight}
                                                        rowRenderer={rowRenderer}
                                                        deferredMeasurementCache={cache}
                                                        overscanRowCount={10}
                                                    />
                                                )}
                                            </AutoSizer>
                                        )}
                                    </InfiniteLoader>
                                ) : (
                                    <div className="p-4 text-center text-sm text-warmgray-500">
                                        Barang tidak ditemukan.
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button className="p-2 border border-warmgray-300 rounded bg-white text-warmgray-600 hover:bg-warmgray-50 transition-colors shadow-sm">
                    <FileText className="h-4 w-4" />
                </button>

                <div className="ml-auto flex items-center gap-3">
                    {/* Local Table Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-warmgray-400" />
                        <input
                            type="text"
                            placeholder="Cari dalam tabel..."
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 border border-warmgray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-48 bg-white"
                        />
                    </div>

                    {/* Total Count Display */}
                    <div className="px-3 py-1.5 bg-white border border-warmgray-300 rounded text-sm font-medium text-warmgray-700 shadow-sm flex items-center gap-2">
                        <span>{items.length} Barang</span>
                        <span className="text-red-500">*</span>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto bg-white relative">
                <table className="w-full text-xs z-10 relative">
                    <thead className="bg-warmgray-50 sticky top-0 z-20 border-b border-warmgray-200">
                        <tr>
                            <th className="py-2 px-2 w-[30px] text-center font-semibold text-warmgray-600 border-r border-warmgray-200">No</th>
                            <th className="py-2 px-4 w-[250px] text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Barang & Jasa</th>
                            <th className="py-2 px-4 w-[200px] text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Catatan</th>
                            <th className="py-2 px-4 text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Kode</th>
                            <th className="py-2 px-2 w-[70px] text-center font-semibold text-warmgray-600 border-r border-warmgray-200">Kuantitas</th>
                            <th className="py-2 px-2 w-[70px] text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Satuan</th>
                            <th className="py-2 px-4 text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Gudang</th>
                            <th className="py-2 px-4 w-[120px] text-left font-semibold text-warmgray-600 border-r border-warmgray-200">Sales Person</th>
                            <th className="py-2 px-4 w-[130px] text-right font-semibold text-warmgray-600 border-r border-warmgray-200">Harga Satuan</th>
                            <th className="py-2 px-2 w-[60px] text-center font-semibold text-warmgray-600 border-r border-warmgray-200">Diskon</th>
                            <th className="py-2 px-4 w-[130px] text-right font-semibold text-warmgray-600">Total Harga</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-warmgray-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="py-12 text-center text-warmgray-400 italic">
                                    Belum ada barang dipilih. Gunakan pencarian di atas untuk menambahkan barang.
                                </td>
                            </tr>
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="py-12 text-center text-warmgray-400 italic">
                                    Tidak ada barang yang cocok dengan pencarian &quot;{tableSearch}&quot;.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="odd:bg-white even:bg-[#fafafb] hover:bg-primary-50 cursor-pointer transition-colors group"
                                    onClick={() => handleEditItem(item)}
                                >
                                    <td className="py-1.5 px-2 text-center font-semibold text-warmgray-600 border-r border-warmgray-100">{index + 1}</td>
                                    <td className="py-1.5 px-3 font-medium text-warmgray-900 border-r border-warmgray-100">{item.description}</td>
                                    <td className="py-1.5 px-3 text-warmgray-600 border-r border-warmgray-100 italic">{item.notes || '-'}</td>
                                    <td className="py-1.5 px-3 text-warmgray-600 border-r border-warmgray-100">{item.itemCode}</td>
                                    <td className="py-1.5 px-3 text-right text-warmgray-900 border-r border-warmgray-100">{item.quantity}</td>
                                    <td className="py-1.5 px-3 text-warmgray-600 border-r border-warmgray-100">{item.unit}</td>
                                    <td className="py-1.5 px-3 text-warmgray-600 border-r border-warmgray-100">{item.warehouseName || '-'}</td>
                                    <td className="py-1.5 px-3 text-warmgray-600 border-r border-warmgray-100">{item.salespersonName || '-'}</td>
                                    <td className="py-1.5 px-3 text-right text-warmgray-900 border-r border-warmgray-100">{formatCurrency(item.unitPrice).replace('Rp', '')}</td>
                                    <td className="py-1.5 px-3 text-right text-warmgray-900 border-r border-warmgray-100">{item.discountAmount > 0 ? formatCurrency(item.discountAmount).replace('Rp', '') : '0'}</td>
                                    <td className="py-1.5 px-3 text-right font-medium text-warmgray-900">{formatCurrency(item.totalAmount).replace('Rp', '')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <ProductDetailModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
                initialData={editingItem}
                mode={editingItem ? 'edit' : 'add'}
            />
        </div>
    );
}
