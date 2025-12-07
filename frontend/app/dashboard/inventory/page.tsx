'use client';

import { useState } from 'react';
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, ArrowUpDown, Filter } from 'lucide-react';
import { Button, Card, Badge, PageTransition, useToast } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatCurrency, formatNumber } from '@/lib/utils';

// Dummy inventory data
const dummyInventory = [
  {
    id: '1',
    code: 'ITEM-001',
    name: 'Product A',
    category: 'Electronics',
    warehouse: 'Main Warehouse',
    unit: 'PCS',
    onHand: 150,
    reserved: 20,
    available: 130,
    minStock: 50,
    maxStock: 200,
    avgCost: 75000,
    totalValue: 11250000,
    lastMovement: '2024-12-05',
    status: 'normal',
  },
  {
    id: '2',
    code: 'ITEM-002',
    name: 'Product B',
    category: 'Electronics',
    warehouse: 'Main Warehouse',
    unit: 'PCS',
    onHand: 35,
    reserved: 10,
    available: 25,
    minStock: 50,
    maxStock: 150,
    avgCost: 180000,
    totalValue: 6300000,
    lastMovement: '2024-12-04',
    status: 'low',
  },
  {
    id: '3',
    code: 'ITEM-003',
    name: 'Product C',
    category: 'Accessories',
    warehouse: 'Secondary',
    unit: 'BOX',
    onHand: 250,
    reserved: 0,
    available: 250,
    minStock: 100,
    maxStock: 300,
    avgCost: 45000,
    totalValue: 11250000,
    lastMovement: '2024-12-03',
    status: 'overstock',
  },
  {
    id: '4',
    code: 'RAW-001',
    name: 'Raw Material A',
    category: 'Raw Materials',
    warehouse: 'Main Warehouse',
    unit: 'KG',
    onHand: 0,
    reserved: 0,
    available: 0,
    minStock: 100,
    maxStock: 500,
    avgCost: 25000,
    totalValue: 0,
    lastMovement: '2024-11-28',
    status: 'out',
  },
];

// Movement history
const movementHistory = [
  { id: '1', date: '2024-12-05', type: 'IN', item: 'Product A', qty: 50, reference: 'GR-00123' },
  { id: '2', date: '2024-12-05', type: 'OUT', item: 'Product B', qty: 15, reference: 'DO-00456' },
  { id: '3', date: '2024-12-04', type: 'IN', item: 'Product C', qty: 100, reference: 'GR-00122' },
  { id: '4', date: '2024-12-04', type: 'OUT', item: 'Product A', qty: 30, reference: 'DO-00455' },
];

export default function InventoryPage() {
  const { addToast } = useToast();
  const [inventory] = useState(dummyInventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof dummyInventory[0] | null>(null);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = filterWarehouse === 'ALL' || item.warehouse === filterWarehouse;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

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

  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockCount = inventory.filter((i) => i.status === 'low' || i.status === 'out').length;

  const openAdjustModal = (item: typeof dummyInventory[0]) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-down">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
          <Card className="card-hover border-l-4 border-primary-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-50 rounded-xl">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-warmgray-500">Total Items</p>
                <p className="text-2xl font-bold text-warmgray-900">{totalItems}</p>
              </div>
            </div>
          </Card>
          <Card className="card-hover border-l-4 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-warmgray-500">Total Value</p>
                <p className="text-2xl font-bold text-warmgray-900">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </Card>
          <Card className="card-hover border-l-4 border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-warmgray-500">Low Stock Alert</p>
                <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
              </div>
            </div>
          </Card>
          <Card className="card-hover border-l-4 border-violet-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-50 rounded-xl">
                <TrendingDown className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-warmgray-500">Today's Movement</p>
                <p className="text-2xl font-bold text-warmgray-900">{movementHistory.filter((m) => m.date === '2024-12-05').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="animate-fade-in p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-100 border border-surface-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200 placeholder:text-warmgray-400"
              />
            </div>
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="px-4 py-2.5 bg-surface-100 border border-surface-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200 text-warmgray-700"
            >
              <option value="ALL">All Warehouses</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Secondary">Secondary</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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

        {/* Stock List */}
        <Card title="Stock List" className="animate-fade-in-up">
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No inventory found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className="table-row-animate"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <p className="text-xs text-primary-600 font-mono">{item.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{item.category}</TableCell>
                    <TableCell className="text-gray-600">{item.warehouse}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(item.onHand)} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {item.reserved > 0 ? formatNumber(item.reserved) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {formatNumber(item.available)} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatCurrency(item.avgCost)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      {formatCurrency(item.totalValue)}
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
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Recent Movements */}
        <Card title="Recent Stock Movements" className="animate-fade-in-up">
          <div className="space-y-3">
            {movementHistory.map((movement, index) => (
              <div
                key={movement.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${movement.type === 'IN' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                  >
                    {movement.type === 'IN' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{movement.item}</p>
                    <p className="text-sm text-gray-500">{movement.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {movement.type === 'IN' ? '+' : '-'}{movement.qty}
                  </p>
                  <p className="text-sm text-gray-500">{movement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

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
                  {formatNumber(selectedItem.onHand)} {selectedItem.unit}
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
