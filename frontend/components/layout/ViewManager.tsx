'use client';

import { useTabContext } from '@/contexts/TabContext';
import { viewRegistry } from '@/config/viewRegistry';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export default function ViewManager({ children }: { children: React.ReactNode }) {
    const { featureTabs, activeFeatureTabId } = useTabContext();
    const pathname = usePathname();

    // We need to decide if we Render Children (Standard Next.js) or ViewManager
    // Checks if CURRENT path is registered in our registry.
    // If NOT registered, we just render `children` (standard behavior).
    // If REGISTERED, we render the ViewManager stack.

    // NOTE: This logic is slightly complex because:
    // If we utilize ViewManager, we want to render ALL open tabs that are registered.
    // But if the user navigates to a non-registered page (e.g. Settings), we must show `children`.

    const isCurrentPathRegistered = !!viewRegistry[pathname];

    return (
        <div className="flex-1 flex flex-col min-h-0 relative h-full">
            {/* 1. Standard Next.js Router Content (e.g. Dashboard, Settings, or non-registered pages) */}
            {/* Show only if current path is NOT registered */}
            <div
                className="flex-1 flex-col h-full"
                style={{ display: !isCurrentPathRegistered ? 'flex' : 'none' }}
            >
                {children}
            </div>

            {/* 2. Registered Persistent Views */}
            {/* Always mounted if in featureTabs, visibility controlled by active state */}
            {featureTabs.map((tab) => {
                const ViewComponent = viewRegistry[tab.href];
                if (!ViewComponent) return null;

                // Tab is visible ONLY if it is the active tab AND the current URL matches a registered view
                // (This prevents showing a "stuck" tab if we navigate to Dashboard)
                const isActive = tab.id === activeFeatureTabId;
                const isVisible = isActive && isCurrentPathRegistered;

                return (
                    <div
                        key={tab.id}
                        className="flex-col h-full bg-surface-100"
                        style={{ display: isVisible ? 'flex' : 'none' }}
                    >
                        <ViewComponent />
                    </div>
                );
            })}
        </div>
    );
}
