'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
export interface DataTab {
    id: string;
    title: string;
    href: string;
    data?: Record<string, unknown>; // Stores unsaved form data
    isDirty?: boolean; // Has unsaved changes
}

export interface FeatureTab {
    id: string;
    title: string;
    href: string;
    icon?: string;
    dataTabs: DataTab[];
    activeDataTabId: string | null;
}

interface TabContextType {
    featureTabs: FeatureTab[];
    activeFeatureTabId: string | null;

    // Feature Tab Actions
    openFeatureTab: (tab: Omit<FeatureTab, 'dataTabs' | 'activeDataTabId'>) => void;
    closeFeatureTab: (id: string) => void;
    setActiveFeatureTab: (id: string) => void;

    // Data Tab Actions
    openDataTab: (featureId: string, tab: Omit<DataTab, 'data' | 'isDirty'>) => void;
    closeDataTab: (featureId: string, tabId: string) => void;
    setActiveDataTab: (featureId: string, tabId: string) => void;
    updateDataTabData: (featureId: string, tabId: string, data: Record<string, unknown>) => void;
    markDataTabDirty: (featureId: string, tabId: string, isDirty: boolean) => void;

    // Helpers
    getActiveFeatureTab: () => FeatureTab | undefined;
    getActiveDataTab: () => DataTab | undefined;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
    const [featureTabs, setFeatureTabs] = useState<FeatureTab[]>([]);
    const [activeFeatureTabId, setActiveFeatureTabIdState] = useState<string | null>(null);

    // Open a new feature tab or switch to existing one
    const openFeatureTab = useCallback((tab: Omit<FeatureTab, 'dataTabs' | 'activeDataTabId'>) => {
        setFeatureTabs(prev => {
            const existing = prev.find(t => t.id === tab.id);
            if (existing) {
                return prev; // Already exists
            }
            return [...prev, { ...tab, dataTabs: [], activeDataTabId: null }];
        });
        setActiveFeatureTabIdState(tab.id);
    }, []);

    // Close a feature tab
    const closeFeatureTab = useCallback((id: string) => {
        setFeatureTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);
            return newTabs;
        });
        setActiveFeatureTabIdState(prev => {
            if (prev === id) {
                const remaining = featureTabs.filter(t => t.id !== id);
                return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
            }
            return prev;
        });
    }, [featureTabs]);

    // Set active feature tab
    const setActiveFeatureTab = useCallback((id: string) => {
        setActiveFeatureTabIdState(id);
    }, []);

    // Open a data tab within a feature
    const openDataTab = useCallback((featureId: string, tab: Omit<DataTab, 'data' | 'isDirty'>) => {
        setFeatureTabs(prev => prev.map(feature => {
            if (feature.id !== featureId) return feature;

            const existing = feature.dataTabs.find(t => t.id === tab.id);
            if (existing) {
                return { ...feature, activeDataTabId: tab.id };
            }

            return {
                ...feature,
                dataTabs: [...feature.dataTabs, { ...tab, data: {}, isDirty: false }],
                activeDataTabId: tab.id,
            };
        }));
    }, []);

    // Close a data tab
    const closeDataTab = useCallback((featureId: string, tabId: string) => {
        setFeatureTabs(prev => prev.map(feature => {
            if (feature.id !== featureId) return feature;

            const newDataTabs = feature.dataTabs.filter(t => t.id !== tabId);
            let newActiveId = feature.activeDataTabId;

            if (feature.activeDataTabId === tabId) {
                newActiveId = newDataTabs.length > 0 ? newDataTabs[newDataTabs.length - 1].id : null;
            }

            return {
                ...feature,
                dataTabs: newDataTabs,
                activeDataTabId: newActiveId,
            };
        }));
    }, []);

    // Set active data tab
    const setActiveDataTab = useCallback((featureId: string, tabId: string) => {
        setFeatureTabs(prev => prev.map(feature => {
            if (feature.id !== featureId) return feature;
            return { ...feature, activeDataTabId: tabId };
        }));
    }, []);

    // Update data tab's stored data (for preserving unsaved input)
    const updateDataTabData = useCallback((featureId: string, tabId: string, data: Record<string, unknown>) => {
        setFeatureTabs(prev => prev.map(feature => {
            if (feature.id !== featureId) return feature;
            return {
                ...feature,
                dataTabs: feature.dataTabs.map(tab => {
                    if (tab.id !== tabId) return tab;
                    return { ...tab, data: { ...tab.data, ...data }, isDirty: true };
                }),
            };
        }));
    }, []);

    // Mark a data tab as dirty/clean
    const markDataTabDirty = useCallback((featureId: string, tabId: string, isDirty: boolean) => {
        setFeatureTabs(prev => prev.map(feature => {
            if (feature.id !== featureId) return feature;
            return {
                ...feature,
                dataTabs: feature.dataTabs.map(tab => {
                    if (tab.id !== tabId) return tab;
                    return { ...tab, isDirty };
                }),
            };
        }));
    }, []);

    // Get active feature tab
    const getActiveFeatureTab = useCallback(() => {
        return featureTabs.find(t => t.id === activeFeatureTabId);
    }, [featureTabs, activeFeatureTabId]);

    // Get active data tab
    const getActiveDataTab = useCallback(() => {
        const feature = getActiveFeatureTab();
        if (!feature) return undefined;
        return feature.dataTabs.find(t => t.id === feature.activeDataTabId);
    }, [getActiveFeatureTab]);

    return (
        <TabContext.Provider value={{
            featureTabs,
            activeFeatureTabId,
            openFeatureTab,
            closeFeatureTab,
            setActiveFeatureTab,
            openDataTab,
            closeDataTab,
            setActiveDataTab,
            updateDataTabData,
            markDataTabDirty,
            getActiveFeatureTab,
            getActiveDataTab,
        }}>
            {children}
        </TabContext.Provider>
    );
}

export function useTabContext() {
    const context = useContext(TabContext);
    if (context === undefined) {
        throw new Error('useTabContext must be used within a TabProvider');
    }
    return context;
}
