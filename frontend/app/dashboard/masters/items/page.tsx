'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Package, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Button, Card, Badge, PageTransition, useToast } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';

// Dummy data
const dummyItems = [
  {
    id: '1',
    code: 'ITEM-001',
    name: 'Product A',
    category: 'Goods',
    type: 'INVENTORY',
    baseUnit: 'PCS',
    salePrice: 100000,
    costPrice: 75000,
    stock: 150,
    isActive: true,
  },
  {
    id: '2',
    code: 'ITEM-002',
    name: 'Product B',
    category: 'Goods',
    type: 'INVENTORY',
    baseUnit: 'PCS',
    salePrice: 250000,
    costPrice: 180000,
    stock: 85,
    isActive: true,
  },
  {
    id: '3',
    code: 'SVC-001',
    name: 'Consultation Service',
    category: 'Services',
    type: 'SERVICE',
    baseUnit: 'HRS',
    salePrice: 500000,
    costPrice: 0,
    stock: 0,
    isActive: true,
  },
  {
    id: '4',
    code: 'ITEM-003',
    name: 'Product C',
    category: 'Goods',
    type: 'INVENTORY',
    baseUnit: 'BOX',
    salePrice: 1500000,
    costPrice: 1200000,
    stock: 25,
    isActive: false,
  },
];

export default function ItemsPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState(dummyItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemId?: string }>({
    isOpen: false,
  });

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setDeleteModal({ isOpen: false });
    addToast({
      type: 'success',
      title: 'Item Deleted',
      message: 'Item has been successfully deleted.',
    });
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-down">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Items</h1>
            <p className="text-xs text-gray-600 mt-0.5">Manage your products and services</p>
          </div>
          <Link href="/dashboard/masters/items/new">
            <Button variant="primary" size="sm" className="gap-2 btn-press">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 stagger-children">
          <Card className="card-hover p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded flex-shrink-0">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Total Items</p>
                <p className="text-lg font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
          </Card>
          <Card className="card-hover p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded flex-shrink-0">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Inventory Items</p>
                <p className="text-lg font-bold text-gray-900">
                  {items.filter((i) => i.type === 'INVENTORY').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="card-hover p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded flex-shrink-0">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Service Items</p>
                <p className="text-lg font-bold text-gray-900">
                  {items.filter((i) => i.type === 'SERVICE').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="card-hover p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded flex-shrink-0">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 truncate">Low Stock</p>
                <p className="text-lg font-bold text-gray-900">
                  {items.filter((i) => i.type === 'INVENTORY' && i.stock < 50).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="animate-fade-in p-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded input-glow transition-all duration-200"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded input-glow transition-all duration-200"
            >
              <option value="ALL">All Types</option>
              <option value="INVENTORY">Inventory</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card className="animate-fade-in-up p-3">
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No items found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className="table-row-animate"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <span className="font-medium text-primary-600">{item.code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </TableCell>
                    <TableCell className="text-gray-600">{item.category}</TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'INVENTORY' ? 'info' : 'purple'}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{item.baseUnit}</TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      {formatCurrency(item.salePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.type === 'INVENTORY' ? (
                        <span
                          className={`font-medium ${
                            item.stock < 50 ? 'text-danger-600' : 'text-gray-900'
                          }`}
                        >
                          {item.stock}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'success' : 'default'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="btn-press">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Link href={`/dashboard/masters/items/${item.id}/edit`}>
                          <Button variant="ghost" size="sm" className="btn-press">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-press text-danger-600 hover:bg-danger-50"
                          onClick={() => setDeleteModal({ isOpen: true, itemId: item.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Delete Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false })}
          title="Delete Item"
          description="Are you sure you want to delete this item?"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteModal({ isOpen: false })}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="btn-press"
                onClick={() => deleteModal.itemId && handleDelete(deleteModal.itemId)}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-gray-600">This action cannot be undone.</p>
        </Modal>
      </div>
    </PageTransition>
  );
}
