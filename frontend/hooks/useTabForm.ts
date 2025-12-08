
import { useEffect, useCallback, useState, useRef } from 'react';
import { useTabContext } from '@/contexts/TabContext';
import { useSearchParams } from 'next/navigation';

export function useTabForm<T extends Record<string, any>>(
    featureId: string,
    defaultValues: T
) {
    const {
        getActiveDataTab,
        updateDataTabData,
        markDataTabDirty
    } = useTabContext();

    const activeTab = getActiveDataTab();
    const searchParams = useSearchParams();

    // Use a ref to track if we've initialized from context to prevent overwriting
    const initialized = useRef(false);

    // Local state for the form
    const [formData, setFormData] = useState<T>(defaultValues);

    // Initialize data from TabContext if available
    useEffect(() => {
        if (!activeTab || initialized.current) return;

        // Check if there is stored data in the tab context
        const storedData = activeTab.data as T | undefined;

        if (storedData && Object.keys(storedData).length > 0) {
            // Restore state from context
            setFormData(prev => ({
                ...prev,
                ...storedData
            }));
        }

        initialized.current = true;
    }, [activeTab]);

    // Sync changes back to TabContext (Debounced ideally, but simple effect for now)
    const handleChange = useCallback((field: keyof T, value: any) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: value };

            // Sync to Context if we have an active tab
            if (activeTab) {
                updateDataTabData(featureId, activeTab.id, newState);
                markDataTabDirty(featureId, activeTab.id, true);
            }

            return newState;
        });
    }, [activeTab, featureId, updateDataTabData, markDataTabDirty]);

    // Helper to reset form (e.g. after successful save)
    const resetForm = useCallback(() => {
        setFormData(defaultValues);
        if (activeTab) {
            updateDataTabData(featureId, activeTab.id, {}); // Clear stored data
            markDataTabDirty(featureId, activeTab.id, false);
        }
    }, [activeTab, featureId, defaultValues, updateDataTabData, markDataTabDirty]);

    return {
        formData,
        handleChange,
        setFormData, // Expose for full overwrites
        resetForm,
        isDirty: activeTab?.isDirty || false
    };
}
