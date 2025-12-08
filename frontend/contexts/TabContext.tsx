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
        let nextPath = '/dashboard';

        setFeatureTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);
            return newTabs;
        });

        setActiveFeatureTabIdState(prev => {
            if (prev === id) {
                const remaining = featureTabs.filter(t => t.id !== id);
                if (remaining.length > 0) {
                    const nextTab = remaining[remaining.length - 1];
                    nextPath = nextTab.href;
                    return nextTab.id;
                }
                nextPath = '/dashboard';
                return null;
            }
            // If we are not closing the active tab, we don't need to navigate
            // But we need to signal that we shouldn't navigate
            nextPath = '';
            return prev;
        });

        if (nextPath) {
            router.push(nextPath);
        }
    }, [featureTabs, router]);

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
