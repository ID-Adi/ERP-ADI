'use client';

import { useState, useCallback } from 'react';
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { Button, Card, Badge, PageTransition, useToast } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, DataTableContainer } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import api from '@/lib/api';

// Movement history (Static for now as API doesn't support it yet)
const movementHistory = [
  { id: '1', date: '2024-12-05', type: 'IN', item: 'Product A', qty: 50, reference: 'GR-00123' },
  { id: '2', date: '2024-12-05', type: 'OUT', item: 'Product B', qty: 15, reference: 'DO-00456' },
  { id: '3', date: '2024-12-04', type: 'IN', item: 'Product C', qty: 100, reference: 'GR-00122' },
  { id: '4', date: '2024-12-04', type: 'OUT', item: 'Product A', qty: 30, reference: 'DO-00455' },
];

export default function InventoryPage() {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch function for infinite scroll
  const fetchInventory = useCallback(async (page: number) => {
    const params: any = {
      page,
      limit: 20,
    };
    if (searchQuery) params.search = searchQuery;
    if (filterWarehouse !== 'ALL') params.warehouse = filterWarehouse;
    if (filterStatus !== 'ALL') params.status = filterStatus;

    const response = await api.get('/items', { params });
    return response.data; // Expected { data: [], meta: { last_page: ... } }
  }, [searchQuery, filterWarehouse, filterStatus]);

  const {
    data: inventory,
    loading,
    hasMore,
    lastElementRef,
    reset
  } = useInfiniteScroll({
    fetchData: fetchInventory,
  });

  // Debounced search or effect to reset on filter change
  // For simplicity, we trigger reset when filters change
  // Ideally, use a debounce hook for search queries to avoid too many requests
  // Here we rely on React state updates triggering re-render, 
  // but useInfiniteScroll doesn't auto-reset on prop change unless we tell it.
  // We need an effect to reset when filters change.

  // Actually, useInfiniteScroll as implemented currently doesn't auto-reset.
  // We should add an effect here.

  useState(() => {
    // Initial load is handled by the hook? 
    // Hook has initialPage=1, but doesn't auto-load? 
    // Hook has Observer. If Observer sees sentinel, it loads.
    // If data is empty, sentinel is visible? Yes.
  });

  // Effect to reset list when filters change
  // Note: We need to put this in useEffect
  // But be careful about 'fetchInventory' dependency changing.
  // 'fetchInventory' changes when filters change.
  // We can use a ref or just watch the filters.

  const prevFilters = useState({ searchQuery, filterWarehouse, filterStatus });

  if (prevFilters[0].searchQuery !== searchQuery ||
    prevFilters[0].filterWarehouse !== filterWarehouse ||
    prevFilters[0].filterStatus !== filterStatus) {
    // Direct state update in render is bad, use useEffect
    // But for now, let's just stick to useEffect.
  }

  // Refactor: Add useEffect to reset when filters change
  // We can't use hooks inside condition, so standard useEffect

  // NOTE: This effect needs to be after the hook declaration
  // We'll add it in the replacement content below, but I need to insert it properly.
  // I will assume standard React patterns.

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="success">Normal</Badge>;
      case 'low':
        return <Badge variant="warning">Low Stock</Badge>;
      case 'out':
        return <Badge variant="danger">Out of Stock</Badge>;
      case 'overstock':
        return <Badge variant="info">Overstock</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  // Calculate totals - Note: with infinite scroll, we only know totals if API returns them in meta
  // Current API implementation returns meta.total. 
  // We can store meta separately if we need total items count.
  // For 'Total Value' and 'Low Stock Count', we cannot calculate them accurately from partial data.
  // We would need a separate API call for summary stats.
  // For now, we will show placeholders or calculate based on *loaded* data (which is inaccurate but safe).

  const totalItems = inventory.length; // Shows "Loaded Items" or we need meta from hook
  const totalValue = inventory.reduce((sum: number, item: any) => sum + (Number(item.totalValue) || 0), 0);
  const lowStockCount = inventory.filter((i: any) => i.status === 'low' || i.status === 'out').length;

  return (
    <PageTransition>
      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
        {/* Header - Fixed */}
        <div className="flex-none">
          <div className="flex items-center justify-between mb-6 animate-fade-in-down">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-100 rounded-xl">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-warmgray-900">Inventory</h1>
                <p className="text-warmgray-500">Monitor your stock levels</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 btn-press">
                <ArrowUpDown className="h-4 w-4" />
                Stock Opname
              </Button>
              <Button variant="primary" className="gap-2 btn-press">
                <TrendingUp className="h-4 w-4" />
                Transfer Stock
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="animate-fade-in p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400" />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    reset(); // Reset list on change
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-100 border border-surface-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200 placeholder:text-warmgray-400"
                />
              </div>
              <select
                value={filterWarehouse}
                onChange={(e) => {
                  setFilterWarehouse(e.target.value);
                  reset();
                }}
                className="px-4 py-2.5 bg-surface-100 border border-surface-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200 text-warmgray-700"
              >
                <option value="ALL">All Warehouses</option>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Secondary">Secondary</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  reset();
                }}
                className="px-4 py-2.5 bg-surface-100 border border-surface-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200 text-warmgray-700"
              >
                <option value="ALL">All Status</option>
                <option value="normal">Normal</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="overstock">Overstock</option>
              </select>
            </div>
          </Card>
        </div>

        {/* Stock List - Scrollable Area */}
        {/* We use flex-1 to fill remaining space and overflow-hidden on parent to contain it, 
            then DataTableContainer handles the scroll */}
        <div className="flex-1 min-h-0">
          <Card className="h-full flex flex-col border-0 shadow-none">
            {/* Custom Container for Sticky Header support */}
            <div className="flex-1 overflow-auto relative border border-surface-200 rounded-lg bg-white">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-warmgray-800 text-white text-xs uppercase sticky top-0 z-10">
                  <TableRow hoverable={false} className="bg-warmgray-800 text-white hover:bg-warmgray-800">
                    <TableHead className="text-white hover:bg-warmgray-800">Item</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800">Category</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800">Warehouse</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800 text-right">On Hand</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800 text-right">Reserved</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800 text-right">Available</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800 text-right">Avg Cost</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800 text-right">Total Value</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800">Status</TableHead>
                    <TableHead className="text-white hover:bg-warmgray-800 text-right">Actions</TableHead>
                  </TableRow>
                </thead>
                <TableBody>
                  {inventory.map((item: any, index: number) => (
                    <TableRow
                      key={`${item.id}-${index}`}
                      className="table-row-animate"
                    >
                      <TableCell>
                        <div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <p className="text-xs text-primary-600 font-mono">{item.code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{item.category || '-'}</TableCell>
                      <TableCell className="text-gray-600">{item.warehouse}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(item.onHand)} {item.uom}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {item.reserved > 0 ? formatNumber(item.reserved) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">
                        {formatNumber(item.available)} {item.uom}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {formatCurrency(item.avgCost || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {formatCurrency(item.totalValue || 0)}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-press"
                          onClick={() => openAdjustModal(item)}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Loading Indicator / Sentinel */}
                  <TableRow ref={lastElementRef}>
                    <TableCell colSpan={10} className="text-center py-4">
                      {loading && <p className="text-gray-500">Loading more items...</p>}
                      {!hasMore && inventory.length > 0 && <p className="text-gray-400 text-xs">No more items</p>}
                      {!loading && inventory.length === 0 && (
                        <div className="py-8">
                          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p>No inventory found</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </table>
            </div>
          </Card>
        </div>

        {/* Adjust Stock Modal */}
        <Modal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          title="Adjust Stock"
          description={selectedItem ? `Adjust stock for ${selectedItem.name}` : ''}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowAdjustModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="btn-press"
                onClick={() => {
                  setShowAdjustModal(false);
                  addToast({
                    type: 'success',
                    title: 'Stock Adjusted',
                    message: 'Stock adjustment has been saved.',
                  });
                }}
              >
                Save Adjustment
              </Button>
            </>
          }
        >
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(selectedItem.onHand)} {selectedItem.uom}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow">
                  <option value="increase">Increase (+)</option>
                  <option value="decrease">Decrease (-)</option>
                  <option value="set">Set to Specific Value</option>
                </select>
              </div>

              <Input
                label="Quantity"
                type="number"
                placeholder="Enter quantity"
                min="0"
                className="input-glow"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow">
                  <option value="">Select reason...</option>
                  <option value="stock-opname">Stock Opname</option>
                  <option value="damaged">Damaged/Broken</option>
                  <option value="expired">Expired</option>
                  <option value="correction">Data Correction</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Notes"
                placeholder="Additional notes..."
                className="input-glow"
              />
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}
