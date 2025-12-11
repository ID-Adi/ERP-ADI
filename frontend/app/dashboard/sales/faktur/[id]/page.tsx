'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition } from '@/components/ui';

import InvoiceForm from '@/components/business/InvoiceForm';
import { useTabContext } from '@/contexts/TabContext';
import api from '@/lib/api';
import { RefreshCw } from 'lucide-react';

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { openDataTab, activeFeatureTabId, getActiveDataTab, updateDataTabData } = useTabContext();
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const featureId = '/dashboard/sales/faktur';
  const tabId = `${featureId}-${invoiceId}`;

  // Transform API data to InvoiceForm format
  const transformInvoiceData = (apiData: any) => {
    return {
      fakturNumber: apiData.fakturNumber,
      vendorCode: apiData.customer?.code || '',
      fakturDate: apiData.fakturDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      dueDate: apiData.dueDate?.split('T')[0] || '',
      memo: apiData.notes || '',
      currency: apiData.currency || 'IDR',
      id: apiData.id,
      salespersonId: apiData.salespersonId || '', // Include invoice-level salesperson
      paymentTerms: apiData.paymentTermId || apiData.paymentTerms || '', // Fallback to paymentTerms col (legacy ID)
      taxInclusive: apiData.taxInclusive ?? true,
      shippingDate: apiData.shippingDate?.split('T')[0] || '',
      lines: apiData.lines?.map((line: any) => ({
        id: line.id,
        itemId: line.itemId,
        itemCode: line.item?.code || '',
        description: line.itemName || line.item?.name || '', // Map itemName from DB to description (Frontend Item Name)
        notes: line.description, // Map description from DB to notes (Frontend User Note)
        quantity: Number(line.quantity),
        unit: line.unit || line.item?.uom || 'PCS',
        unitPrice: Number(line.unitPrice),
        discountPercent: Number(line.discountPercent || 0),
        discountAmount: Number(line.discountAmount || 0),
        taxPercent: 11,
        lineAmount: Number(line.amount),
        taxAmount: 0,
        totalAmount: Number(line.amount),
        // Map warehouse and salesperson data
        warehouseId: line.warehouseId || '',
        warehouseName: line.warehouse?.name || '-',
        salespersonId: line.salespersonId || apiData.salespersonId || '', // Use line salesperson if available, else invoice level
        salespersonName: line.salesperson?.name || apiData.salesperson?.name || '-',
      })) || [],
      costs: apiData.costs?.map((cost: any) => ({
        id: cost.id,
        accountId: cost.accountId,
        accountCode: cost.account?.code || '',
        accountName: cost.account?.name || '',
        amount: Number(cost.amount),
        notes: cost.notes || ''
      })) || []
    };
  };

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/fakturs/${invoiceId}`);
        const transformedData = transformInvoiceData(response.data);
        setInvoiceData(transformedData);
        setError(null);
      } catch (err) {
        setError('Failed to load invoice');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  // Open tab when data is loaded
  useEffect(() => {
    if (invoiceData) {
      if (activeFeatureTabId === featureId || activeFeatureTabId === null) {
        openDataTab(featureId, {
          id: tabId,
          title: invoiceData.fakturNumber || 'Edit Invoice',
          href: `/dashboard/sales/faktur/${invoiceId}`,
        });
      }
    }
  }, [invoiceData, invoiceId, openDataTab, activeFeatureTabId, tabId]);

  // Retrieve cached data if available
  const activeTab = getActiveDataTab();
  const cachedData = (activeTab?.id === tabId && activeTab?.data && Object.keys(activeTab.data).length > 0)
    ? activeTab.data
    : null;

  // Use cached data if available, but backfill from invoiceData if cache is missing fields (stale cache fix)
  const displayData = cachedData
    ? {
      ...cachedData,
      // Ensure critical fields are populated from fresh API data if missing in cache
      paymentTerms: cachedData.paymentTerms || invoiceData?.paymentTerms || '',
      paymentTermId: cachedData.paymentTermId || invoiceData?.paymentTermId || ''
    }
    : invoiceData;

  if (loading && !displayData) {
    return (
      <PageTransition className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary-600" />
          <span className="text-warmgray-600">Loading invoice...</span>
        </div>
      </PageTransition>
    );
  }

  if (error && !displayData) {
    return (
      <PageTransition className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger-600 font-semibold mb-2">{error}</p>
          <p className="text-warmgray-600 text-sm">Please try again</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="h-full flex flex-col">
      {/* Invoice Editor */}
      <div className="flex-1 overflow-hidden h-full">
        <div className="h-full">
          <InvoiceForm
            initialData={displayData}
            onDataChange={(data) => {
              updateDataTabData(featureId, tabId, data);
            }}
            onSave={() => {
              // Save logic here
            }}
          />
        </div>
      </div>
    </PageTransition>
  );
}
