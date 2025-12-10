'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTabContext } from '@/contexts/TabContext';
import { cn } from '@/lib/utils';
import { confirmAction } from '@/lib/swal';
export function FeatureTabBar() {
    const router = useRouter();
    const { featureTabs, activeFeatureTabId, setActiveFeatureTab, closeFeatureTab, isInitialized } = useTabContext();

    if (!isInitialized) {
        return (
            <div className="flex items-center bg-warmgray-800 border-b border-warmgray-700 overflow-x-auto h-[38px]">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 px-4 py-2 border-r border-warmgray-700 min-w-[120px]"
                    >
                        <div className="h-4 w-20 bg-warmgray-700/50 rounded animate-pulse" />
                        <div className="h-3.5 w-3.5 bg-warmgray-700/50 rounded animate-pulse ml-auto" />
                    </div>
                ))}
            </div>
        );
    }

    if (featureTabs.length === 0) return null;

    return (
        <div className="flex items-center bg-warmgray-800 border-b border-warmgray-700 overflow-x-auto">
            {featureTabs.map((tab) => {
                const isActive = tab.id === activeFeatureTabId;
                const hasDirtyTabs = tab.dataTabs.some(dt => dt.isDirty);

                return (
                    <div
                        key={tab.id}
                        onClick={() => {
                            setActiveFeatureTab(tab.id);
                            router.push(tab.href);
                        }}
                        className={cn(
                            "group flex items-center gap-2 px-4 py-2 text-sm font-medium border-r border-warmgray-700 transition-colors whitespace-nowrap cursor-pointer",
                            isActive
                                ? "bg-primary-600 text-white"
                                : "bg-warmgray-800 text-warmgray-300 hover:bg-warmgray-700 hover:text-white"
                        )}
                        role="button"
                        tabIndex={0}
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
                    </div>
                );
            })}
        </div>
    );
}

export function DataTabBar() {
    const router = useRouter();
    const {
        activeFeatureTabId,
        getActiveFeatureTab,
        setActiveDataTab,
        closeDataTab,
        isInitialized
    } = useTabContext();

    if (!isInitialized) {
        return (
            <div className="flex items-center bg-surface-100 border-b border-surface-300 overflow-x-auto h-[33px]">
                {[1].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 border-r border-surface-300 min-w-[80px]"
                    >
                        <div className="h-3 w-12 bg-surface-200 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    const activeFeature = getActiveFeatureTab();

    if (!activeFeature || activeFeature.dataTabs.length === 0) return null;

    return (
        <div className="flex items-center bg-surface-100 border-b border-surface-300 overflow-x-auto">
            {activeFeature.dataTabs.map((tab) => {
                const isActive = tab.id === activeFeature.activeDataTabId;

                return (
                    <div
                        key={tab.id}
                        onClick={() => {
                            setActiveDataTab(activeFeature.id, tab.id);
                            // Only push if href is different/defined (some data tabs might be purely local state?)
                            // Assuming data tabs should also route if they have unique hrefs
                            if (tab.href) router.push(tab.href);
                        }}
                        className={cn(
                            "group flex items-center gap-2 px-3 py-1.5 text-xs font-medium border-r border-surface-300 transition-colors whitespace-nowrap cursor-pointer",
                            isActive
                                ? "bg-white text-warmgray-900 shadow-sm"
                                : "bg-surface-100 text-warmgray-600 hover:bg-surface-200 hover:text-warmgray-900"
                        )}
                        role="button"
                        tabIndex={0}
                    >
                        {tab.isDirty && (
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        )}
                        <span>{tab.title}</span>
                        {tab.title !== 'Daftar' && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (tab.isDirty) {
                                        const result = await confirmAction(
                                            'Perubahan Belum Disimpan',
                                            'Tab ini memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin menutupnya?',
                                            'Ya, Tutup'
                                        );
                                        if (!result.isConfirmed) return;
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
                        )}
                    </div>
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
