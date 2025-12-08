'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { TabBars } from './TabBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-surface-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col transition-all duration-300 ease-out ${sidebarCollapsed ? 'w-20' : 'w-64'
          } bg-surface-50 border-r border-surface-300`}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-warmgray-900/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-slide-in-left">
            <Sidebar collapsed={false} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onCollapseSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Tab Bars */}
        <TabBars />

        {/* Content Area - Full width, no max-w constraint */}
        <main className="flex-1 flex flex-col overflow-hidden bg-surface-100">
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

