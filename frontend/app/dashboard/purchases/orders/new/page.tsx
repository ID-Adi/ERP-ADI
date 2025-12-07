'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, ShoppingCart, Calculator } from 'lucide-react';
import { Button, Input, Card, PageTransition, useToast } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

interface LineItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

// Dummy data
const dummyItems = [
  { code: 'RAW-001', name: 'Raw Material A', price: 50000 },
  { code: 'RAW-002', name: 'Raw Material B', price: 75000 },
  { code: 'COMP-001', name: 'Component X', price: 125000 },
  { code: 'COMP-002', name: 'Component Y', price: 200000 },
];

const dummyVendors = [
  { code: 'VEND-00001', name: 'PT Supplier Indonesia' },
  { code: 'VEND-00002', name: 'CV Material Jaya' },
  { code: 'VEND-00003', name: 'PT Logistik Utama' },
];

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorCode: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    memo: '',
  });

  const [lines, setLines] = useState<LineItem[]>([
    {
      id: '1',
      itemCode: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 11,
      lineAmount: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
    },
  ]);

  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0,
  });

  const calculateLine = (line: LineItem): LineItem => {
    const lineAmount = line.quantity * line.unitPrice;
    const discountAmount = (lineAmount * line.discountPercent) / 100;
    const taxableAmount = lineAmount - discountAmount;
    const taxAmount = (taxableAmount * line.taxPercent) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return { ...line, lineAmount, discountAmount, taxAmount, totalAmount };
  };

  useEffect(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineAmount, 0);
    const totalDiscount = lines.reduce((sum, line) => sum + line.discountAmount, 0);
    const totalTax = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const grandTotal = lines.reduce((sum, line) => sum + line.totalAmount, 0);

    setTotals({ subtotal, totalDiscount, totalTax, grandTotal });
  }, [lines]);

  const handleLineChange = (index: number, field: keyof LineItem, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    newLines[index] = calculateLine(newLines[index]);
    setLines(newLines);
  };

  const handleItemSelect = (index: number, itemCode: string) => {
    const item = dummyItems.find((i) => i.code === itemCode);
    if (item) {
      const newLines = [...lines];
      newLines[index] = {
        ...newLines[index],
        itemCode,
        description: item.name,
        unitPrice: item.price,
      };
      newLines[index] = calculateLine(newLines[index]);
      setLines(newLines);
    }
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: Date.now().toString(),
        itemCode: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 11,
        lineAmount: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'success',
        title: 'Purchase Order Created',
        message: 'PO has been saved successfully.',
      });
      router.push('/dashboard/purchases/orders');
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in-down">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 btn-press">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
              <p className="text-gray-600">Create a new purchase order</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 stagger-children">
          {/* Header Info */}
          <Card title="Order Information" className="card-hover">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor <span className="text-danger-600">*</span>
                </label>
                <select
                  value={formData.vendorCode}
                  onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow transition-all duration-200"
                  required
                >
                  <option value="">Select Vendor</option>
                  {dummyVendors.map((vendor) => (
                    <option key={vendor.code} value={vendor.code}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Order Date"
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                required
                className="input-glow"
              />

              <Input
                label="Expected Delivery"
                type="date"
                value={formData.expectedDate}
                onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                required
                className="input-glow"
              />
            </div>
          </Card>

          {/* Line Items */}
          <Card
            title="Order Items"
            headerAction={
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-2 btn-press">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            }
            className="card-hover"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                      Item / Description
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Disc %</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax %</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lines.map((line, index) => (
                    <tr
                      key={line.id}
                      className="hover:bg-gray-50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-3 py-3 text-gray-700 font-medium">{index + 1}</td>
                      <td className="px-3 py-3">
                        <select
                          value={line.itemCode}
                          onChange={(e) => handleItemSelect(index, e.target.value)}
                          className="w-full px-2 py-1.5 mb-1 border border-gray-300 rounded input-glow text-sm"
                        >
                          <option value="">Select Item</option>
                          {dummyItems.map((item) => (
                            <option key={item.code} value={item.code}>
                              [{item.code}] {item.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded input-glow text-sm"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) =>
                            handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          step="0.01"
                          className="w-20 px-2 py-1.5 border border-gray-300 rounded input-glow text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) =>
                            handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          className="w-32 px-2 py-1.5 border border-gray-300 rounded input-glow text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={line.discountPercent}
                          onChange={(e) =>
                            handleLineChange(index, 'discountPercent', parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          max="100"
                          className="w-16 px-2 py-1.5 border border-gray-300 rounded input-glow text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={line.taxPercent}
                          onChange={(e) =>
                            handleLineChange(index, 'taxPercent', parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          max="100"
                          className="w-16 px-2 py-1.5 border border-gray-300 rounded input-glow text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(line.totalAmount)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          disabled={lines.length === 1}
                          className="btn-press text-danger-600 hover:bg-danger-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Totals */}
          <Card title="Order Summary" className="card-hover">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">({formatCurrency(totals.totalDiscount)})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (PPN):</span>
                <span className="font-medium text-gray-900">{formatCurrency(totals.totalTax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span className="text-gray-900">Grand Total:</span>
                <span className="text-purple-600">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </Card>

          {/* Memo */}
          <Card title="Notes" className="card-hover">
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              rows={3}
              placeholder="Add any notes or instructions for this order..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow transition-all duration-200"
            />
          </Card>
        </form>

        {/* Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg animate-slide-in-right">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Grand Total</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(totals.grandTotal)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} className="btn-press">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="btn-press"
                onClick={handleSubmit}
              >
                {isLoading ? 'Saving...' : 'Save Purchase Order'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
