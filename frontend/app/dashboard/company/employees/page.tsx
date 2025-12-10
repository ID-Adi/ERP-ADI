'use client';

import React from 'react';
import { useTabContext } from '@/contexts/TabContext';
import { cn } from '@/lib/utils';
import EmployeeList from './EmployeeList';
import EmployeeForm from './EmployeeForm';

export default function EmployeesPage() {
      const {
            getActiveDataTab,
            openDataTab,
            closeDataTab,
            updateDataTabData,
      } = useTabContext();
      const featureId = '/dashboard/company/employees';

      // Derived state from TabContext
      const activeDataTab = getActiveDataTab();
      const activeTabId = activeDataTab?.id;

      const isListView = !activeTabId || activeTabId === `${featureId}-list`;
      const isFormView = activeTabId && (activeTabId === `${featureId}-new` || activeTabId.startsWith(`${featureId}-edit-`));

      // Extract ID for edit if applicable
      const editId = activeTabId?.startsWith(`${featureId}-edit-`) ? activeTabId.replace(`${featureId}-edit-`, '') : null;

      const handleNewClick = () => {
            openDataTab(featureId, {
                  id: `${featureId}-new`,
                  title: 'Data Baru',
                  href: featureId
            });
      };

      const handleCancelForm = () => {
            if (activeTabId) {
                  closeDataTab(featureId, activeTabId);
            }
      };



      // We need to pass the data to the form.
      // The activeDataTab object from getActiveDataTab() should contain the data if we updated it.
      // But since we can't pass it in openDataTab, we might need to set it.
      // Alternatively, we can just pass the employee object directly if we track it.

      // Let's refine handleEditClick:
      const handleEditClick = (employee: any) => {
            const tabId = `${featureId}-edit-${employee.id}`;
            openDataTab(featureId, {
                  id: tabId,
                  title: employee.fullName,
                  href: featureId
            });
            // We need to update the data in the context so it can be retrieved.
            // Assuming we have access to updateDataTabData from useTabContext
            updateDataTabData(featureId, tabId, employee);
      };

      // And in the render:
      // initialData={activeDataTab?.data}

      return (
            <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden relative">
                  {/* FORM VIEW OVERLAY */}
                  <div className={cn(
                        "absolute inset-0 z-20 bg-white flex flex-col transition-opacity duration-200",
                        isFormView ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none hidden"
                  )}>
                        {isFormView && (
                              <EmployeeForm
                                    key={activeTabId || 'form'}
                                    initialData={activeDataTab?.data}
                                    onCancel={handleCancelForm}
                              />
                        )}
                  </div>

                  {/* LIST VIEW CONTENT */}
                  <div className={cn("contents")}>
                        <EmployeeList
                              onNewClick={handleNewClick}
                              onEdit={handleEditClick}
                        />
                  </div>
            </div>
      );
}
