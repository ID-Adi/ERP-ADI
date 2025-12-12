'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import TabBar from './TabBar';
import { confirmAction } from '@/lib/swal';

export interface InvoiceTab {
  id: string;
  label: string;
  hasUnsavedChanges: boolean;
  data: any;
}

interface TabbedInvoiceEditorProps {
  children: (tab: InvoiceTab, onDataChange: (data: any) => void, updateTabLabel: (label: string) => void) => ReactNode;
  initialTabData?: any;
}

export default function TabbedInvoiceEditor({ children, initialTabData }: TabbedInvoiceEditorProps) {
  const createDefaultTab = () => ({
    id: '1',
    label: 'Faktur 1 (Draft)',
    hasUnsavedChanges: false,
    data: {
      vendorCode: '',
      fakturDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      memo: '',
      lines: [
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
      ],
    },
  });

  const createTabFromData = (data: any) => ({
    id: '1',
    label: data.fakturNumber || 'Edit Invoice',
    hasUnsavedChanges: false,
    data: data,
  });

  const [tabs, setTabs] = useState<InvoiceTab[]>([
    initialTabData ? createTabFromData(initialTabData) : createDefaultTab(),
  ]);

  const [activeTabId, setActiveTabId] = useState('1');
  const activeTab = tabs.find((tab) => tab.id === activeTabId)!;

  // Keyboard shortcuts


  // Add new tab
  const addTab = useCallback(() => {
    const newId = Math.random().toString(36).substring(7);
    const newTab: InvoiceTab = {
      id: newId,
      label: `Faktur ${tabs.length + 1} (Draft)`,
      hasUnsavedChanges: false,
      data: {
        vendorCode: '',
        fakturDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        memo: '',
        lines: [
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
        ],
      },
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }, [tabs.length]);

  // Close tab
  const closeTab = useCallback(
    async (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);

      if (tab?.hasUnsavedChanges) {
        const result = await confirmAction(
          'Ada Perubahan',
          'Ada perubahan yang belum disimpan. Tutup tab ini?',
          'Ya, Tutup'
        );
        if (!result.isConfirmed) {
          return;
        }
      }

      const newTabs = tabs.filter((t) => t.id !== tabId);
      if (newTabs.length === 0) {
        addTab();
      } else if (activeTabId === tabId) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      setTabs(newTabs);
    },
    [tabs, activeTabId, addTab]
  );

  // Close all except one
  const closeAllExcept = useCallback((tabId: string) => {
    setTabs([tabs.find((t) => t.id === tabId)!]);
    setActiveTabId(tabId);
  }, [tabs]);

  // Close all saved tabs
  const closeAllSaved = useCallback(() => {
    const unsavedTabs = tabs.filter((t) => t.hasUnsavedChanges);
    if (unsavedTabs.length === 0) {
      addTab();
      return;
    }
    setTabs(unsavedTabs);
    setActiveTabId(unsavedTabs[0].id);
  }, [tabs, addTab]);

  // Update tab data
  const updateTabData = useCallback(
    (data: any) => {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId
            ? {
              ...tab,
              data,
              hasUnsavedChanges: true,
            }
            : tab
        )
      );
    },
    [activeTabId]
  );

  // Update tab label
  const updateTabLabel = useCallback(
    (label: string) => {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTabId ? { ...tab, label } : tab))
      );
    },
    [activeTabId]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N atau Cmd+N - New tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addTab();
      }

      // Ctrl+W atau Cmd+W - Close tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        closeTab(activeTabId);
      }

      // Ctrl+Tab - Next tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTabId(tabs[nextIndex].id);
      }

      // Ctrl+Shift+Tab - Previous tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        setActiveTabId(tabs[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, addTab, closeTab]);

  return (
    <div className="flex flex-col h-full">
      {/* Advanced Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTabId}
        onTabClose={closeTab}
        onAddTab={addTab}
        onCloseAllExcept={closeAllExcept}
        onCloseAllSaved={closeAllSaved}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {children(activeTab, updateTabData, updateTabLabel)}
      </div>
    </div>
  );
}

export function useTabbedInvoice() {
  return {};
}
