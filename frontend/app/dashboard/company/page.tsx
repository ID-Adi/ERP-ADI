'use client';

import React from 'react';
import Link from 'next/link';
import {
    Banknote,
    Store,
    Percent,
    CreditCard,
    Truck,
    Ship,
    Wallet,
    Users,
    Repeat,
    CalendarCheck2,
    Contact,
    Star,
    FileCheck,
    Calendar,
    History,
    Building2 // For title icon if needed
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
    { title: 'Mata Uang', icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Cabang', icon: Store, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Pajak', icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Syarat Pembayaran', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Pengiriman', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'FOB', icon: Ship, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Gaji/Tunjangan', icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Karyawan', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Transaksi Berulang', icon: Repeat, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { title: 'Proses Akhir Bulan', icon: CalendarCheck2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { title: 'Kontak', icon: Contact, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { title: 'Transaksi Favorit', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { title: 'Persetujuan (Approval)', icon: FileCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { title: 'Kalender', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { title: 'Log Aktifitas', icon: History, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
];

export default function CompanyPage() {
    return (
        <div className="space-y-6 px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-warmgray-900">Perusahaan</h1>
                <div className="h-0.5 w-full bg-primary-500 mt-2 rounded-full opacity-20"></div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const content = (
                        <div
                            className={cn(
                                "group relative flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-200 cursor-pointer border",
                                "hover:shadow-lg hover:-translate-y-1",
                                item.bg,
                                item.border
                            )}
                        >
                            <div className="mb-4">
                                <Icon className={cn("w-10 h-10 stroke-[1.5]", item.color)} />
                            </div>
                            <span className="text-sm font-medium text-warmgray-700 text-center leading-tight">
                                {item.title}
                            </span>
                        </div>
                    );

                    if (item.title === 'Karyawan') {
                        return (
                            <div
                                key={index}
                                onClick={() => {
                                    // We can't easily access context here without wrapping or using a hook in a child
                                    // But since this is a client component, we can use router.push which TabContext listens to
                                    // OR we can use the context if we are inside the provider (we are)
                                    // Let's use Link as it's standard navigation, but ensure TabContext picks it up.
                                    // The issue might be that TabContext needs to know about this route.
                                    // If the user says "tabbar yang memiliki background hitam", that's the Feature Tab bar.
                                    // This usually corresponds to the URL segment.
                                }}
                            >
                                <Link href="/dashboard/company/employees">
                                    {content}
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <div key={index}>
                            {content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
