'use client';

import {
    Settings,
    Users,
    Shield,
    Hash,
    Printer,
    FileCheck,
    Store,
    Wallet,
    Cpu,
} from 'lucide-react';
import Link from 'next/link';

const settingItems = [
    {
        title: 'Preferences',
        description: 'General system preferences',
        icon: Settings,
        href: '/dashboard/settings/preferences',
    },
    {
        title: 'Group Access',
        description: 'Manage roles and permissions',
        icon: Shield,
        href: '/dashboard/settings/groups',
    },
    {
        title: 'Users',
        description: 'Manage system users',
        icon: Users,
        href: '/dashboard/settings/users',
    },
    {
        title: 'Numbering',
        description: 'Transaction numbering sequences',
        icon: Hash,
        href: '/dashboard/settings/numbering',
    },
    {
        title: 'Print Templates',
        description: 'Customize invoices and reports',
        icon: Printer,
        href: '/dashboard/settings/templates',
    },
    {
        title: 'Approvals',
        description: 'Transaction approval workflows',
        icon: FileCheck,
        href: '/dashboard/settings/approvals',
    },
    {
        title: 'Apps Store',
        description: 'Integrations and add-ons',
        icon: Store,
        href: '/dashboard/settings/store',
    },
    {
        title: 'Capital',
        description: 'Financial services and loans',
        icon: Wallet,
        href: '/dashboard/settings/capital', // Using Wallet as closest match for "Capital"
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-warmgray-900">Settings</h1>
                <p className="text-sm text-warmgray-500 mt-1">
                    Manage your application settings and preferences
                </p>
                <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-transparent mt-4 rounded-full opacity-20" />
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {settingItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            className="group flex flex-col items-center justify-center p-6 bg-primary-50/50 border-2 border-primary-100 rounded-2xl hover:bg-white hover:border-primary-400 hover:shadow-soft-lg transition-all duration-300 cursor-pointer"
                        >
                            <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 mb-4 border border-primary-100">
                                <Icon className="h-8 w-8 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-warmgray-900 group-hover:text-primary-700 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-warmgray-500 text-center mt-2 transition-opacity duration-300">
                                {item.description}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
