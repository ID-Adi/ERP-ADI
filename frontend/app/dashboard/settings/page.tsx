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
        href: '/dashboard/settings/capital',
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6 px-6 lg:px-8 py-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-warmgray-900">Settings</h1>
                <p className="text-sm text-warmgray-500 mt-1">
                    Manage your application settings and preferences
                </p>
                <div className="h-0.5 w-full bg-primary-100 mt-4 rounded-full" />
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {settingItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            className="group flex flex-col items-center justify-center p-8 bg-white border border-warmgray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        >
                            <div className="p-4 bg-primary-50 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                                <Icon className="h-8 w-8 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-bold text-warmgray-900 mb-2">
                                {item.title}
                            </h3>
                            <p className="text-sm text-warmgray-500 text-center">
                                {item.description}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
