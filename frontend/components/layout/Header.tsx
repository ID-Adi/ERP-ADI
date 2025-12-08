'use client';

import { Bell, Search, Menu, ChevronsLeft, ChevronsRight, LogOut, User as UserIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
  onCollapseSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function Header({ onMenuClick, onCollapseSidebar, sidebarCollapsed }: HeaderProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 pl-2 lg:pl-3 hover:bg-surface-200 rounded-xl p-1 transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-medium text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-warmgray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-warmgray-500">{user?.role || 'Staff'}</p>
            </div>
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-surface-200 py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-surface-100 lg:hidden">
                <p className="text-sm font-medium text-warmgray-900">{user?.name}</p>
                <p className="text-xs text-warmgray-500">{user?.role}</p>
              </div>

              <button className="w-full text-left px-4 py-2 text-sm text-warmgray-700 hover:bg-surface-100 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Profile
              </button>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
