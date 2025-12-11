'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import { menuItems, MenuItem, isMenuItemActive } from '@/config/menu';

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Penjualan']);
  const [openPopup, setOpenPopup] = useState<string | null>(null);
  const { openFeatureTab, openDataTab } = useTabContext();

  // Handle menu item click - opens as a tab
  const handleMenuClick = (item: MenuItem) => {
    if (!item.href) return;

    // Open as Feature Tab
    openFeatureTab({
      id: item.href,
      title: item.title,
      href: item.href,
    });

    // Also open a "List" data tab for the feature
    openDataTab(item.href, {
      id: `${item.href}-list`,
      title: 'Daftar',
      href: item.href,
    });

    // Navigate using router
    router.push(item.href);
  };

  // Close popup when clicking outside or navigating
  const togglePopup = (title: string) => {
    setOpenPopup(current => current === title ? null : title);
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    if (item.hidden) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const Icon = item.icon;

    if (collapsed) {
      // Collapsed View Logic
      const isActiveItem = isMenuItemActive(item, pathname);

      if (item.href) {
        return (
          <button
            key={item.href}
            onClick={() => handleMenuClick(item)}
            className={cn(
              'group relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200',
              isActiveItem
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-warmgray-500 hover:bg-surface-200 hover:text-warmgray-900',
            )}
            title={item.title}
          >
            <Icon className="h-5 w-5" />

            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-warmgray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
              {item.title}
            </div>
          </button>
        );
      }

      // Menu with children in collapsed view - Floating Popup
      const isOpen = openPopup === item.title;

      return (
        <div key={item.title} className="relative group mx-auto w-10 h-10 flex items-center justify-center">
          <button
            onClick={() => togglePopup(item.title)}
            className={cn(
              'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
              isActiveItem
                ? 'bg-primary-100 text-primary-700 shadow-sm ring-1 ring-primary-200'
                : 'text-warmgray-500 hover:bg-surface-200 hover:text-warmgray-900',
              isOpen && 'bg-surface-200 text-warmgray-900'
            )}
          >
            <Icon className="h-5 w-5" />
          </button>

          {/* Tooltip (Only if popup CLOSED) */}
          {!isOpen && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-warmgray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl">
              {item.title}
            </div>
          )}

          {/* Floating Popup Menu */}
          {isOpen && (
            <>
              {/* Backdrop to close */}
              <div className="fixed inset-0 z-40" onClick={() => setOpenPopup(null)} />

              {/* Menu Content */}
              <div className={cn(
                "absolute left-full top-0 ml-3 bg-white rounded-xl shadow-xl border border-surface-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left",
                "w-max"
              )}>
                <div className="px-4 py-3 border-b border-surface-100 bg-surface-50">
                  <span className="text-sm font-semibold text-warmgray-900">{item.title}</span>
                </div>
                <div className={cn(
                  "p-1.5",
                  item.children && item.children.length > 8 && "grid grid-cols-2 gap-1"
                )}>
                  {item.children?.map((child) => (
                    <button
                      key={child.title}
                      onClick={() => {
                        setOpenPopup(null);
                        handleMenuClick(child);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                        isActive(child.href)
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-warmgray-600 hover:bg-surface-100 hover:text-warmgray-900"
                      )}
                    >
                      <child.icon className="h-4 w-4 opacity-70" />
                      <span className="whitespace-nowrap">{child.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    // Expanded view
    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
              'hover:bg-surface-200 text-warmgray-700'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-warmgray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-warmgray-400" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-3 mt-1 space-y-1 border-l-2 border-surface-300 pl-3">
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.href}
        onClick={() => handleMenuClick(item)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-left',
          isActive(item.href)
            ? 'bg-primary-600 text-white shadow-md'
            : 'text-warmgray-700 hover:bg-surface-200 hover:text-warmgray-900'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{item.title}</span>
      </button>
    );
  };

  return (
    <aside className={cn(
      "flex flex-col h-full bg-surface-50",
      collapsed && "items-center"
    )}>
      {/* Logo */}
      <div className={cn(
        "py-4 border-b border-surface-300/50 flex-shrink-0",
        collapsed ? "px-2 flex justify-center" : "px-4"
      )}>
        {collapsed ? (
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">E</span>
          </div>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-bold">E</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-warmgray-900 truncate">ERP ADI</h1>
              <p className="text-xs text-warmgray-500 truncate">Enterprise</p>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 py-4", // Removed overflow-y-auto when collapsed to allow popups to overlay
        collapsed ? "px-2 space-y-2 overflow-visible" : "px-4 space-y-1.5 overflow-y-auto"
      )}>
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* User Info */}
      {collapsed ? (
        <div className="py-4 border-t border-surface-300/50 flex-shrink-0 flex justify-center">
          <div className="group relative w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-all duration-200">
            <span className="text-white font-medium text-sm">A</span>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-warmgray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Administrator
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 border-t border-surface-300/50 flex-shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-200 transition-all duration-200 cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-medium text-sm">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-warmgray-900 truncate">Administrator</p>
              <p className="text-xs text-warmgray-500 truncate">admin@erp.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
