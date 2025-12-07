'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function NewContactPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'CUSTOMER',
    email: '',
    phone: '',
    website: '',
    // Address
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Indonesia',
    // Tax Info
    npwp: '',
    taxName: '',
    // Sales Config
    creditLimit: '0',
    paymentTerm: '30',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulasi save (nanti akan diganti dengan API call)
    setTimeout(() => {
      setIsLoading(false);
      // Redirect ke list page
      router.push('/dashboard/masters/contacts');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Contact</h1>
          <p className="text-gray-600 mt-1">Create a new customer or vendor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information */}
        <Card title="General Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Auto-generated if empty"
              helperText="Leave empty to auto-generate"
            />

            <Input
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              as="select"
            >
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="CUSTOMER">Customer</option>
                <option value="VENDOR">Vendor</option>
                <option value="BOTH">Both</option>
              </select>
            </Input>

            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Company name"
              required
              className="md:col-span-2"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@company.com"
              required
            />

            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="021-1234567"
              required
            />

            <Input
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://company.com"
              className="md:col-span-2"
            />
          </div>
        </Card>

        {/* Address Information */}
        <Card title="Address Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Jl. Example No. 123"
              className="md:col-span-2"
            />

            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Jakarta"
            />

            <Input
              label="State/Province"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="DKI Jakarta"
            />

            <Input
              label="Postal Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="12345"
            />

            <Input
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Indonesia"
            />
          </div>
        </Card>

        {/* Tax Information */}
        <Card title="Tax Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NPWP"
              name="npwp"
              value={formData.npwp}
              onChange={handleChange}
              placeholder="00.000.000.0-000.000"
            />

            <Input
              label="Tax Name"
              name="taxName"
              value={formData.taxName}
              onChange={handleChange}
              placeholder="Name on tax document"
            />
          </div>
        </Card>

        {/* Sales Configuration (if Customer) */}
        {(formData.type === 'CUSTOMER' || formData.type === 'BOTH') && (
          <Card title="Sales Configuration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Credit Limit"
                name="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />

              <Input
                label="Payment Term (days)"
                name="paymentTerm"
                type="number"
                value={formData.paymentTerm}
                onChange={handleChange}
                placeholder="30"
                min="0"
              />
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Contact'}
          </Button>
        </div>
      </form>
    </div>
  );
}
