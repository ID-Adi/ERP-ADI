'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Circle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  hasUnsavedChanges: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
  onCloseAllExcept?: (tabId: string) => void;
  onCloseAllSaved?: () => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onAddTab,
  onCloseAllExcept,
  onCloseAllSaved,
}: TabBarProps) {
  const [scrollPos, setScrollPos] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);

  const canScrollLeft = scrollPos > 0;
  const canScrollRight = scrollPos < 100; // Simplified - real implementation would use refs

  const scroll = (direction: 'left' | 'right') => {
    const amount = 200;
    setScrollPos((prev) => {
      const newPos = direction === 'left' ? Math.max(0, prev - amount) : Math.min(100, prev + amount);
      return newPos;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ tabId, x: e.clientX, y: e.clientY });
  };

  return (
    <>
      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center h-14">
          {/* Scroll Left */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="flex-shrink-0 px-2 py-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
          )}

          {/* Tabs Container */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex gap-1 px-4 py-0 min-w-fit">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  onClick={() => onTabClick(tab.id)}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-3 border-b-2 transition-all duration-200 cursor-pointer min-w-fit whitespace-nowrap',
                    activeTabId === tab.id
                      ? 'border-primary-500 bg-white'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  {/* Unsaved indicator */}
                  {tab.hasUnsavedChanges && (
                    <Circle className="h-2 w-2 fill-orange-500 text-orange-500 animate-pulse flex-shrink-0" />
                  )}

                  {/* Label */}
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors duration-200 max-w-[200px] truncate',
                      activeTabId === tab.id ? 'text-gray-900' : 'text-gray-600'
                    )}
                    title={tab.label}
                  >
                    {tab.label}
                  </span>

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                    className={cn(
                      'flex-shrink-0 p-0.5 rounded hover:bg-gray-300 transition-colors duration-200',
                      'opacity-0 group-hover:opacity-100'
                    )}
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Right */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="flex-shrink-0 px-2 py-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          )}

          {/* Add Tab Button */}
          <button
            onClick={onAddTab}
            className="flex-shrink-0 flex items-center justify-center w-10 h-14 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 ml-auto border-l border-gray-200"
            title="Add new invoice (Ctrl+N)"
          >
            <span className="text-lg font-bold">+</span>
          </button>

          {/* Tab Options */}
          {tabs.length > 1 && (
            <div className="flex-shrink-0 px-2 py-2 border-l border-gray-200">
              <button className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="Tab options">
                <Settings className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-scale-in"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
            }}
          >
            <button
              onClick={() => {
                onTabClose(contextMenu.tabId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Close Tab
            </button>
            {onCloseAllExcept && (
              <button
                onClick={() => {
                  onCloseAllExcept(contextMenu.tabId);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors whitespace-nowrap border-t border-gray-100"
              >
                Close Others
              </button>
            )}
            {onCloseAllSaved && (
              <button
                onClick={() => {
                  onCloseAllSaved();
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors whitespace-nowrap border-t border-gray-100"
              >
                Close All Saved
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
