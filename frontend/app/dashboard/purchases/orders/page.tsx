'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Eye, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { Button, Card, Badge, PageTransition, useToast } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

// Dummy data
const dummyPurchaseOrders = [
  {
    id: '1',
    poNumber: 'PO-00001',
    vendorName: 'PT Supplier Indonesia',
    orderDate: '2024-12-01',
    expectedDate: '2024-12-15',
    subtotal: 25000000,
    taxAmount: 2750000,
    total: 27750000,
    status: 'DRAFT',
  },
  {
    id: '2',
    poNumber: 'PO-00002',
    vendorName: 'CV Material Jaya',
    orderDate: '2024-12-02',
    expectedDate: '2024-12-10',
    subtotal: 12500000,
    taxAmount: 1375000,
    total: 13875000,
    status: 'APPROVED',
  },
  {
    id: '3',
    poNumber: 'PO-00003',
    vendorName: 'PT Logistik Utama',
    orderDate: '2024-12-03',
    expectedDate: '2024-12-20',
    subtotal: 45000000,
    taxAmount: 4950000,
    total: 49950000,
    status: 'RECEIVED',
  },
];

export default function PurchaseOrdersPage() {
  const { addToast } = useToast();
  const [orders] = useState(dummyPurchaseOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'APPROVED': return 'info';
      case 'RECEIVED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-down">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-xs text-gray-600 mt-0.5">Manage your purchase orders</p>
          </div>
          <Link href="/dashboard/purchases/orders/new">
            <Button variant="primary" size="sm" className="gap-2 btn-press">
              <Plus className="h-4 w-4" />
              Create PO
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 stagger-children">
          <Card className="card-hover">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </Card>
          <Card className="card-hover">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-500">
                {orders.filter((o) => o.status === 'DRAFT').length}
              </p>
              <p className="text-sm text-gray-600">Draft</p>
            </div>
          </Card>
          <Card className="card-hover">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {orders.filter((o) => o.status === 'APPROVED').length}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </Card>
          <Card className="card-hover">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {orders.filter((o) => o.status === 'RECEIVED').length}
              </p>
              <p className="text-sm text-gray-600">Received</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by PO number or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg input-glow transition-all duration-200"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg input-glow transition-all duration-200"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card className="animate-fade-in-up">
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>PO Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No purchase orders found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order, index) => (
                  <TableRow
                    key={order.id}
                    className="table-row-animate"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-600">{order.poNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900">{order.vendorName}</span>
                    </TableCell>
                    <TableCell className="text-gray-600">{formatDate(order.orderDate)}</TableCell>
                    <TableCell className="text-gray-600">{formatDate(order.expectedDate)}</TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="btn-press">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="btn-press">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="btn-press text-danger-600 hover:bg-danger-50">
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
      </div>
    </PageTransition>
  );
}
