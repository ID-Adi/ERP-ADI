'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calculator } from 'lucide-react';
import { Button, Input, Card, useToast } from '@/components/ui';
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

interface InvoiceFormProps {
  initialData: {
    vendorCode: string;
    invoiceDate: string;
    dueDate: string;
    memo: string;
    lines: LineItem[];
  };
  onDataChange: (data: any) => void;
  onSave: () => void;
  tabLabel?: string;
  onTabLabelChange?: (label: string) => void;
}

// Dummy data
const dummyItems = [
  { code: 'ITEM-001', name: 'Product A', price: 100000 },
  { code: 'ITEM-002', name: 'Product B', price: 250000 },
  { code: 'ITEM-003', name: 'Service Consultation', price: 500000 },
  { code: 'ITEM-004', name: 'Training Package', price: 1500000 },
];

const dummyCustomers = [
  { code: 'CUST-00001', name: 'PT Maju Jaya' },
  { code: 'CUST-00002', name: 'CV Berkah Sejahtera' },
  { code: 'CUST-00003', name: 'PT Global Indonesia' },
];

export default function InvoiceForm({
  initialData,
  onDataChange,
  onSave,
  tabLabel,
  onTabLabelChange,
}: InvoiceFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState(initialData);
  const [lines, setLines] = useState<LineItem[]>(initialData.lines);
  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0,
  });

  // Calculate line item amounts
  const calculateLine = (line: LineItem): LineItem => {
    const lineAmount = line.quantity * line.unitPrice;
    const discountAmount = (lineAmount * line.discountPercent) / 100;
    const taxableAmount = lineAmount - discountAmount;
    const taxAmount = (taxableAmount * line.taxPercent) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
      ...line,
      lineAmount,
      discountAmount,
      taxAmount,
      totalAmount,
    };
  };

  // Calculate invoice totals
  useEffect(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineAmount, 0);
    const totalDiscount = lines.reduce((sum, line) => sum + line.discountAmount, 0);
    const totalTax = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const grandTotal = lines.reduce((sum, line) => sum + line.totalAmount, 0);

    setTotals({ subtotal, totalDiscount, totalTax, grandTotal });

    // Notify parent about data change
    const newData = { ...formData, lines };
    setFormData(newData);
    onDataChange(newData);

    // Update tab label dengan customer dan total
    if (onTabLabelChange && formData.vendorCode) {
      const customer = dummyCustomers.find((c) => c.code === formData.vendorCode);
      const customerName = customer?.name || 'Invoice';
      const total = formatCurrency(grandTotal);
      onTabLabelChange(`${customerName} - ${total}`);
    }
  }, [lines, formData.vendorCode, onTabLabelChange, formData]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    onDataChange(newData);

    // Update tab label saat customer dipilih
    if (name === 'vendorCode' && onTabLabelChange) {
      const customer = dummyCustomers.find((c) => c.code === value);
      const customerName = customer?.name || 'Invoice';
      const total = formatCurrency(totals.grandTotal);
      onTabLabelChange(`${customerName} - ${total}`);
    }
  };

  const handleLineChange = (index: number, field: keyof LineItem, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    newLines[index] = calculateLine(newLines[index]);
    setLines(newLines);
  };

  const handleItemSelect = (index: number, itemCode: string) => {
    const item = dummyItems.find((i) => i.code === itemCode);
    if (item) {
      handleLineChange(index, 'itemCode', itemCode);
      handleLineChange(index, 'description', item.name);
      handleLineChange(index, 'unitPrice', item.price);
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
        title: 'Invoice Saved',
        message: 'Invoice has been saved successfully.',
      });
      onSave();
      router.push('/dashboard/sales/invoices');
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24">
      {/* Header Info - Compact Grid */}
      <Card title="Invoice Header" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Customer <span className="text-danger-600">*</span>
            </label>
            <select
              name="vendorCode"
              value={formData.vendorCode}
              onChange={handleFormChange}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded input-glow transition-all duration-200"
              required
            >
              <option value="">Select Customer</option>
              {dummyCustomers.map((customer) => (
                <option key={customer.code} value={customer.code}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Invoice Date <span className="text-danger-600">*</span>
            </label>
            <input
              type="date"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleFormChange}
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded input-glow transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Due Date <span className="text-danger-600">*</span>
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleFormChange}
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded input-glow transition-all duration-200"
            />
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card
        title="Line Items"
        headerAction={
          <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-2 btn-press">
            <Plus className="h-4 w-4" />
            Add Line
          </Button>
        }
        className="p-3"
      >
        <div className="overflow-x-auto -mx-3">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-y border-gray-200 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 w-8">#</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 min-w-[180px]">
                  Item / Description
                </th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-16">Qty</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-20">Unit Price</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-12">Disc %</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-12">Tax %</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-20">Amount</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, index) => (
                <tr key={line.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-1.5 text-gray-600 font-medium">{index + 1}</td>
                  <td className="px-2 py-1.5">
                    <select
                      value={line.itemCode}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      className="w-full px-1.5 py-1 mb-0.5 border border-gray-300 rounded input-glow text-xs"
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
                      className="w-full px-1.5 py-1 border border-gray-300 rounded input-glow text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.01"
                      className="w-full px-1.5 py-1 border border-gray-300 rounded input-glow text-right text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) =>
                        handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.01"
                      className="w-full px-1.5 py-1 border border-gray-300 rounded input-glow text-right text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={line.discountPercent}
                      onChange={(e) =>
                        handleLineChange(index, 'discountPercent', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-1.5 py-1 border border-gray-300 rounded input-glow text-right text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={line.taxPercent}
                      onChange={(e) =>
                        handleLineChange(index, 'taxPercent', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-1.5 py-1 border border-gray-300 rounded input-glow text-right text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right font-semibold text-gray-900 text-xs">
                    {formatCurrency(line.totalAmount)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(index)}
                      disabled={lines.length === 1}
                      className="btn-press text-danger-600 hover:bg-danger-50 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Totals */}
      <Card title="Invoice Summary" className="p-4">
        <div className="max-w-sm ml-auto space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Discount:</span>
            <span className="font-medium text-red-600">({formatCurrency(totals.totalDiscount)})</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Tax (PPN):</span>
            <span className="font-medium text-gray-900">{formatCurrency(totals.totalTax)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
            <span>Grand Total:</span>
            <span className="text-primary-600 text-base">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>
      </Card>

      {/* Memo */}
      <Card title="Memo / Notes" className="p-4">
        <textarea
          name="memo"
          value={formData.memo}
          onChange={handleFormChange}
          rows={2}
          placeholder="Add any additional notes here..."
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded input-glow transition-all duration-200 resize-none"
        />
      </Card>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Grand Total</p>
              <p className="text-xl font-bold text-primary-600">{formatCurrency(totals.grandTotal)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="btn-press">
              Draft
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="btn-press">
              {isLoading ? 'Saving...' : 'Save & Post'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
