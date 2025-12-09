import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, MoreHorizontal, Paperclip, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import ProductDetailModal from './ProductDetailModal';
import api from '@/lib/api';

// Shared LineItem interface (should be centralized ideally)
interface LineItem {
    id: string;
    itemId?: string; // Database ID of the item (for backend)
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

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch only items that are sellable (type: Persediaan or Jasa)
                const response = await api.get('/items', { params: { limit: 100 } });
                setProducts(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            }
        };
        fetchProducts();
    }, []);

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
            // Remove dots (thousand separators) and replace comma with dot if needed
            // Assuming simplified Indonesian format for now where dot = thousand separator
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
            itemId: product.id, // Store the actual database ID
            itemCode: product.code,
            description: product.name,
            quantity: 1,
            unit: product.unit || 'PCS',
            unitPrice: sellPrice,
            discountPercent: 0,
            discountAmount: 0,
            taxPercent: 11, // Default PPN
            lineAmount: sellPrice,
            taxAmount: sellPrice * 0.11,
            totalAmount: sellPrice * 1.11,
        };
        // Open modal for confirmation/editing instead of adding immediately
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
            // Edit existing item in the list
            const newItems = [...items];
            newItems[existingItemIndex] = item;
            onItemsChange(newItems);
        } else {
            // Add new item to the list
            onItemsChange([...items, item]);
        }
        setModalOpen(false);
        setEditingItem(undefined);
    };

    const handleDeleteItem = (id: string) => {
        onItemsChange(items.filter(i => i.id !== id));
        setModalOpen(false);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    {isDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-warmgray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                            {filteredProducts.length > 0 ? (
                                <ul>
                                    {filteredProducts.map(product => (
                                        <li
                                            key={product.id}
                                            onClick={() => handleAddItem(product)}
                                            className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-warmgray-50 last:border-0"
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
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 text-center text-sm text-warmgray-500">
                                    Barang tidak ditemukan.
                                </div>
                            )}
                        </div>
                    )}
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
                            <th className="py-2 px-2 w-[30px] text-center font-semibold text-warmgray-600"></th>
                            <th className="py-2 px-4 text-left font-semibold text-warmgray-600">Barang & Jasa</th>
                            <th className="py-2 px-4 text-left font-semibold text-warmgray-600">Kode</th>
                            <th className="py-2 px-2 w-[70px] text-center font-semibold text-warmgray-600">Kuantitas</th>
                            <th className="py-2 px-2 w-[70px] text-left font-semibold text-warmgray-600">Satuan</th>
                            <th className="py-2 px-4 text-right font-semibold text-warmgray-600">Harga Satuan</th>
                            <th className="py-2 px-2 w-[60px] text-center font-semibold text-warmgray-600">Diskon</th>
                            <th className="py-2 px-4 text-right font-semibold text-warmgray-600">Total Harga</th>
                            <th className="py-2 px-2 w-[40px] text-center font-semibold text-warmgray-600"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-warmgray-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-warmgray-400 italic">
                                    Belum ada barang dipilih. Gunakan pencarian di atas untuk menambahkan barang.
                                </td>
                            </tr>
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-warmgray-400 italic">
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
                                    <td className="py-1.5 px-2 text-center text-warmgray-400">=</td>
                                    <td className="py-1.5 px-3 font-medium text-warmgray-900">{item.description}</td>
                                    <td className="py-1.5 px-3 text-warmgray-600">{item.itemCode}</td>
                                    <td className="py-1.5 px-3 text-right text-warmgray-900">{item.quantity}</td>
                                    <td className="py-1.5 px-3 text-warmgray-600">{item.unit}</td>
                                    <td className="py-1.5 px-3 text-right text-warmgray-900">{formatCurrency(item.unitPrice).replace('Rp', '')}</td>
                                    <td className="py-1.5 px-3 text-right text-warmgray-900">{item.discountAmount > 0 ? formatCurrency(item.discountAmount).replace('Rp', '') : '0'}</td>
                                    <td className="py-1.5 px-3 text-right font-medium text-warmgray-900">{formatCurrency(item.totalAmount).replace('Rp', '')}</td>
                                    <td className="py-1.5 px-3 text-warmgray-600">{item.salespersonId ? 'SC - Santi' : '-'}</td>
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
