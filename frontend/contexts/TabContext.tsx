'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { menuItems, MenuItem } from '@/config/menu';

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
    openDataTab: (featureId: string, tab: Omit<DataTab, 'isDirty'>) => void;
    closeDataTab: (featureId: string, tabId: string) => void;
    setActiveDataTab: (featureId: string, tabId: string) => void;
    updateDataTabData: (featureId: string, tabId: string, data: Record<string, unknown>) => void;
    markDataTabDirty: (featureId: string, tabId: string, isDirty: boolean) => void;

    // Helpers
    getActiveFeatureTab: () => FeatureTab | undefined;
    getActiveDataTab: () => DataTab | undefined;
    isInitialized: boolean;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
    const [featureTabs, setFeatureTabs] = useState<FeatureTab[]>([]);
    const [activeFeatureTabId, setActiveFeatureTabIdState] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Helper to find menu item by href
    const findMenuItem = useCallback((items: MenuItem[], path: string): MenuItem | null => {
        for (const item of items) {
            if (item.href === path) return item;
            if (item.children) {
                const found = findMenuItem(item.children, path);
                if (found) return found;
            }
        }
        return null;
    }, []);

    // Helper to find parent menu item for sub-routes like /new, /edit/[id]
    const findParentMenuItem = useCallback((items: MenuItem[], path: string): MenuItem | null => {
        let bestMatch: MenuItem | null = null;
        let maxLength = -1;

        const traverse = (currentItems: MenuItem[]) => {
            for (const item of currentItems) {
                if (item.href) {
                    // Check for exact match or prefix match
                    const isExact = item.href === path;
                    const isPrefix = path.startsWith(item.href + '/');

                    if ((isExact || isPrefix) && item.href.length > maxLength) {
                        maxLength = item.href.length;
                        bestMatch = item;
                    }
                }

                if (item.children) {
                    traverse(item.children);
                }
            }
        };

        traverse(items);
        return bestMatch;
    }, []);

    // Sync tabs with URL
    useEffect(() => {
        // Skip for dashboard root
        if (pathname === '/dashboard') return;

        // Try exact match first, then parent match for sub-routes
        let item = findMenuItem(menuItems, pathname);
        const isSubRoute = !item && pathname.includes('/new') || pathname.includes('/edit');

        if (!item) {
            item = findParentMenuItem(menuItems, pathname);
        }

        if (item && item.href) {
            // Check if tab already exists
            setFeatureTabs(prev => {
                const existing = prev.find(t => t.id === item.href);
                if (!existing) {
                    // Open new tab WITH default data tab
                    const defaultDataTab: DataTab = {
                        id: `${item.href}-list`,
                        title: 'Daftar',
                        href: item.href!
                    };

                    return [...prev, {
                        id: item.href!,
                        title: item.title,
                        href: item.href!,
                        dataTabs: [defaultDataTab],
                        activeDataTabId: defaultDataTab.id
                    }];
                }
                return prev;
            });
            setActiveFeatureTabIdState(item.href);
        }
    }, [pathname, findMenuItem, findParentMenuItem]);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedTabs = localStorage.getItem('erp-feature-tabs');
        const savedActiveId = localStorage.getItem('erp-active-feature-tab');
        if (savedTabs) {
            try {
                setFeatureTabs(JSON.parse(savedTabs));
            } catch (e) {
                console.error("Failed to parse tabs from local storage", e);
            }
        }
        if (savedActiveId) {
            setActiveFeatureTabIdState(savedActiveId);
        }
        setIsInitialized(true);
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (featureTabs.length > 0) {
            localStorage.setItem('erp-feature-tabs', JSON.stringify(featureTabs));
        }
        if (activeFeatureTabId) {
            localStorage.setItem('erp-active-feature-tab', activeFeatureTabId);
        }
    }, [featureTabs, activeFeatureTabId]);

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
        // Calculate next state *before* updating
        const isClosingActive = activeFeatureTabId === id;
        let nextTabId = activeFeatureTabId;
        let nextPath = '';

        const currentIndex = featureTabs.findIndex(t => t.id === id);
        const remainingTabs = featureTabs.filter(t => t.id !== id);

        if (isClosingActive) {
            if (remainingTabs.length > 0) {
                // Better Logic: Go to the nearest LEFT tab (previous neighbor)
                // If closing index 1, try to go to index 0.
                // If closing index 0, go to new index 0 (which was 1).
                let nextIndex = currentIndex - 1;
                if (nextIndex < 0) nextIndex = 0;

                // Safety clamp
                if (nextIndex >= remainingTabs.length) {
                    nextIndex = remainingTabs.length - 1;
                }

                const nextTab = remainingTabs[nextIndex];
                nextTabId = nextTab.id;
                nextPath = nextTab.href;
            } else {
                nextTabId = null;
                nextPath = '/dashboard';
            }
        }

        // Apply State Updates
        setFeatureTabs(remainingTabs);

        if (isClosingActive) {
            setActiveFeatureTabIdState(nextTabId);
            if (nextPath) {
                router.push(nextPath);
            }
        }
    }, [featureTabs, activeFeatureTabId, router]);

    // Set active feature tab
    const setActiveFeatureTab = useCallback((id: string) => {
        setActiveFeatureTabIdState(id);
    }, []);

    // Open a data tab within a feature
    const openDataTab = useCallback((featureId: string, tab: Omit<DataTab, 'isDirty'>) => {
        setFeatureTabs(prev => prev.map(feature => {
            if (feature.id !== featureId) return feature;

            const existing = feature.dataTabs.find(t => t.id === tab.id);
            if (existing) {
                return { ...feature, activeDataTabId: tab.id };
            }

            return {
                ...feature,
                dataTabs: [...feature.dataTabs, { ...tab, data: tab.data || {}, isDirty: false }],
                activeDataTabId: tab.id,
            };
        }));
    }, []);

    // Close a data tab
    const closeDataTab = useCallback((featureId: string, tabId: string) => {
        const feature = featureTabs.find(f => f.id === featureId);
        if (!feature) return;

        const isClosingActive = feature.activeDataTabId === tabId;
        const newDataTabs = feature.dataTabs.filter(t => t.id !== tabId);
        let newActiveId = feature.activeDataTabId;
        let nextPath = '';

        if (isClosingActive) {
            if (newDataTabs.length > 0) {
                const nextTab = newDataTabs[newDataTabs.length - 1];
                newActiveId = nextTab.id;
                nextPath = nextTab.href;
            } else {
                newActiveId = null;
                // Fallback to feature href if all data tabs closed
                nextPath = "/dashboard"; // Or feature.href if available? Feature href usually opens default data tab.
                // Let's stick to dashboard or current feature href without list?
                nextPath = feature.href;
            }
        }

        setFeatureTabs(prev => prev.map(f => {
            if (f.id !== featureId) return f;
            return {
                ...f,
                dataTabs: newDataTabs,
                activeDataTabId: newActiveId,
            };
        }));

        if (isClosingActive && nextPath) {
            router.push(nextPath);
        }
    }, [featureTabs, router]);

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
            isInitialized,
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
