'use client';

import { ArrowLeft } from 'lucide-react';
import { Button, PageTransition } from '@/components/ui';
import TabbedInvoiceEditor, { InvoiceTab } from '@/components/business/InvoiceTabs';
import InvoiceForm from '@/components/business/InvoiceForm';

export default function NewInvoicePage() {
  return (
    <PageTransition className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 animate-fade-in-down">
        <Button variant="ghost" size="sm" className="gap-2 btn-press">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Create Invoices</h1>
          <p className="text-xs text-gray-600">
            Open multiple invoice tabs and manage them side by side — Shortcuts: Ctrl+N (new), Ctrl+W (close), Ctrl+Tab (switch)
          </p>
        </div>
      </div>

      {/* Tabbed Invoice Editor */}
      <div className="flex-1 overflow-hidden">
        <TabbedInvoiceEditor>
          {(tab: InvoiceTab, onDataChange: (data: any) => void, updateTabLabel: (label: string) => void) => (
            <div className="p-4 md:p-6 overflow-auto h-full max-w-7xl mx-auto">
              <InvoiceForm
                initialData={tab.data}
                onDataChange={onDataChange}
                onSave={() => {
                  // Save logic here
                }}
                tabLabel={tab.label}
                onTabLabelChange={updateTabLabel}
              />
            </div>
          )}
        </TabbedInvoiceEditor>
      </div>
    </PageTransition>
  );
}
