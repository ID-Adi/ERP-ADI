'use client';

import { X } from 'lucide-react';
import { useTabContext } from '@/contexts/TabContext';
import { cn } from '@/lib/utils';

export function FeatureTabBar() {
    const { featureTabs, activeFeatureTabId, setActiveFeatureTab, closeFeatureTab } = useTabContext();

    if (featureTabs.length === 0) return null;

    return (
        <div className="flex items-center bg-warmgray-800 border-b border-warmgray-700 overflow-x-auto">
            {featureTabs.map((tab) => {
                const isActive = tab.id === activeFeatureTabId;
                const hasDirtyTabs = tab.dataTabs.some(dt => dt.isDirty);

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFeatureTab(tab.id)}
                        className={cn(
                            "group flex items-center gap-2 px-4 py-2 text-sm font-medium border-r border-warmgray-700 transition-colors whitespace-nowrap",
                            isActive
                                ? "bg-primary-600 text-white"
                                : "bg-warmgray-800 text-warmgray-300 hover:bg-warmgray-700 hover:text-white"
                        )}
                    >
                        <span>{tab.title}</span>
                        {hasDirtyTabs && (
                            <span className="w-2 h-2 bg-amber-400 rounded-full" title="Has unsaved changes" />
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeFeatureTab(tab.id);
                            }}
                            className={cn(
                                "p-0.5 rounded hover:bg-white/20 transition-colors",
                                isActive ? "text-white/70 hover:text-white" : "text-warmgray-500 hover:text-white"
                            )}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </button>
                );
            })}
        </div>
    );
}

export function DataTabBar() {
    const {
        activeFeatureTabId,
        getActiveFeatureTab,
        setActiveDataTab,
        closeDataTab
    } = useTabContext();

    const activeFeature = getActiveFeatureTab();

    if (!activeFeature || activeFeature.dataTabs.length === 0) return null;

    return (
        <div className="flex items-center bg-surface-100 border-b border-surface-300 overflow-x-auto">
            {activeFeature.dataTabs.map((tab) => {
                const isActive = tab.id === activeFeature.activeDataTabId;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveDataTab(activeFeature.id, tab.id)}
                        className={cn(
                            "group flex items-center gap-2 px-3 py-1.5 text-xs font-medium border-r border-surface-300 transition-colors whitespace-nowrap",
                            isActive
                                ? "bg-white text-warmgray-900 shadow-sm"
                                : "bg-surface-100 text-warmgray-600 hover:bg-surface-200 hover:text-warmgray-900"
                        )}
                    >
                        {tab.isDirty && (
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        )}
                        <span>{tab.title}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (tab.isDirty) {
                                    const confirmed = window.confirm('This tab has unsaved changes. Close anyway?');
                                    if (!confirmed) return;
                                }
                                closeDataTab(activeFeature.id, tab.id);
                            }}
                            className={cn(
                                "p-0.5 rounded hover:bg-warmgray-200 transition-colors opacity-0 group-hover:opacity-100",
                                isActive ? "text-warmgray-500" : "text-warmgray-400"
                            )}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </button>
                );
            })}
        </div>
    );
}

// Combined component for easy use
export function TabBars() {
    return (
        <div className="flex flex-col">
            <FeatureTabBar />
            <DataTabBar />
        </div>
    );
}
