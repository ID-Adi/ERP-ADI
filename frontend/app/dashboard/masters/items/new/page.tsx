'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import { Button, Input, Card, PageTransition, useToast } from '@/components/ui';

export default function NewItemPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'INVENTORY',
    category: '',
    description: '',
    baseUnit: 'PCS',
    salePrice: '',
    costPrice: '',
    minStock: '0',
    maxStock: '',
    taxable: true,
    isActive: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'success',
        title: 'Item Created',
        message: 'New item has been created successfully.',
      });
      router.push('/dashboard/masters/items');
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in-down">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 btn-press">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Item</h1>
              <p className="text-gray-600">Create a new product or service</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 stagger-children">
          {/* General Information */}
          <Card title="General Information" className="card-hover">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Item Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Auto-generated if empty"
                className="input-glow"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-danger-600">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow transition-all duration-200"
                  required
                >
                  <option value="INVENTORY">Inventory Item</option>
                  <option value="SERVICE">Service</option>
                  <option value="NON_INVENTORY">Non-Inventory</option>
                </select>
              </div>

              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Item name"
                required
                className="md:col-span-2 input-glow"
              />

              <Input
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Electronics, Services"
                className="input-glow"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Unit</label>
                <select
                  name="baseUnit"
                  value={formData.baseUnit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow transition-all duration-200"
                >
                  <option value="PCS">Pieces (PCS)</option>
                  <option value="BOX">Box</option>
                  <option value="KG">Kilogram (KG)</option>
                  <option value="LTR">Liter (LTR)</option>
                  <option value="MTR">Meter (MTR)</option>
                  <option value="HRS">Hours (HRS)</option>
                  <option value="SET">Set</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Item description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow transition-all duration-200"
                />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card title="Pricing" className="card-hover">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Sale Price"
                name="salePrice"
                type="number"
                value={formData.salePrice}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="input-glow"
              />

              <Input
                label="Cost Price"
                name="costPrice"
                type="number"
                value={formData.costPrice}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="input-glow"
              />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="taxable"
                  name="taxable"
                  checked={formData.taxable}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="taxable" className="text-sm font-medium text-gray-700">
                  Taxable (PPN 11%)
                </label>
              </div>
            </div>
          </Card>

          {/* Stock Settings (only for Inventory items) */}
          {formData.type === 'INVENTORY' && (
            <Card title="Stock Settings" className="card-hover animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Minimum Stock"
                  name="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  helperText="Alert when stock falls below this level"
                  className="input-glow"
                />

                <Input
                  label="Maximum Stock"
                  name="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  helperText="Maximum stock to maintain"
                  className="input-glow"
                />
              </div>
            </Card>
          )}

          {/* Status */}
          <Card className="card-hover">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Item (can be used in transactions)
              </label>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 animate-fade-in-up">
            <Button type="button" variant="secondary" onClick={() => router.back()} className="btn-press">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="btn-press">
              {isLoading ? 'Saving...' : 'Save Item'}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
