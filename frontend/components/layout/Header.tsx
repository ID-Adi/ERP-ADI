'use client';

import { Bell, Search, Menu, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from '@/components/ui/Button';

interface HeaderProps {
  onMenuClick?: () => void;
  onCollapseSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function Header({ onMenuClick, onCollapseSidebar, sidebarCollapsed }: HeaderProps) {
  return (
    <header className="h-14 bg-surface-50/80 backdrop-blur-sm border-b border-surface-300/50 sticky top-0 z-30 flex items-center px-4 lg:px-6 gap-4">
      {/* Left Side - Menu & Search */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-surface-200 rounded-xl transition-all duration-200"
        >
          <Menu className="h-5 w-5 text-warmgray-700" />
        </button>

        {/* Desktop Collapse */}
        <button
          onClick={onCollapseSidebar}
          className="hidden lg:flex p-2 hover:bg-surface-200 rounded-xl transition-all duration-200"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-5 w-5 text-warmgray-600" />
          ) : (
            <ChevronsLeft className="h-5 w-5 text-warmgray-600" />
          )}
        </button>

        {/* Search Bar */}
        <div className="relative hidden md:block flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-100 border border-surface-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200 placeholder:text-warmgray-400"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-surface-200 rounded-xl transition-all duration-200">
          <Bell className="h-5 w-5 text-warmgray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-surface-50" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-surface-300 hidden sm:block" />

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 lg:pl-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-medium text-sm">A</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-warmgray-900">Admin</p>
            <p className="text-xs text-warmgray-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
