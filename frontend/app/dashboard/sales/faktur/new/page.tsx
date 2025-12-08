'use client';

import { useEffect } from 'react';
import { PageTransition } from '@/components/ui';
import InvoiceForm from '@/components/business/InvoiceForm';
import { useTabContext } from '@/contexts/TabContext';

export default function NewInvoicePage() {
  const { openDataTab, activeFeatureTabId, getActiveDataTab, updateDataTabData } = useTabContext();
  const featureId = '/dashboard/sales/faktur';
  const tabId = `${featureId}-new`;

  // Buka tab "Data Baru" saat halaman dimuat
  useEffect(() => {
    // Pastikan feature tab sudah aktif
    if (activeFeatureTabId === featureId || activeFeatureTabId === null) {
      openDataTab(featureId, {
        id: tabId,
        title: 'Data Baru',
        href: '/dashboard/sales/faktur/new',
      });
    }
  }, [openDataTab, activeFeatureTabId]);

  // Retrieve cached data if available
  const activeTab = getActiveDataTab();
  // Ensure we only use cache if it matches our tab ID (to avoid cross-tab contamination if logic is loose)
  const cachedData = (activeTab?.id === tabId && activeTab?.data && Object.keys(activeTab.data).length > 0)
    ? activeTab.data
    : null;

  // Default initial data for new invoice
  const defaultInvoiceData = {
    vendorCode: '',
    fakturDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    memo: '',
    lines: [],
  };

  return (
    <PageTransition className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden h-full">
        <div className="h-full">
          <InvoiceForm
            initialData={(cachedData as any) || defaultInvoiceData}
            onDataChange={(data) => {
              // Persist state to TabContext on every change
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
