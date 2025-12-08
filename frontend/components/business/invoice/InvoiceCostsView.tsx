'use client';

import { Search, MoreHorizontal, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dummy interface
interface CostItem {
    id: string;
    name: string;
    code: string;
    amount: number;
}

interface InvoiceCostsViewProps {
    // props...
}

export default function InvoiceCostsView({ }: InvoiceCostsViewProps) {
    // Placeholder data as per image (Empty State)
    const items: CostItem[] = [];

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-warmgray-200 overflow-hidden relative">
            {/* Search Bar */}
            <div className="p-2 border-b border-warmgray-200 flex items-center justify-between bg-warmgray-50/50">
                <div className="relative w-1/3">
                    <input
                        type="text"
                        placeholder="Cari/Pilih Akun Perkiraan..."
                        className="w-full pl-3 pr-8 py-1.5 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                    />
                    <Search className="absolute right-2 top-2 h-4 w-4 text-warmgray-400" />
                </div>

                <div className="text-sm font-semibold text-warmgray-600">
                    Biaya Lainnya <span className="text-red-500">*</span>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto bg-white relative">
                {/* LUNAS Stamp */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-0">
                    <div className="border-4 border-green-500 text-green-500 font-bold text-6xl px-8 py-2 transform -rotate-12 rounded-lg tracking-widest">
                        LUNAS
                    </div>
                </div>

                <table className="w-full text-xs z-10 relative">
                    <thead className="bg-[#4a5f75] text-white">
                        <tr>
                            <th className="w-8 py-2 text-center border-r border-[#5b738b]">
                                <MoreHorizontal className="h-3 w-3 mx-auto" />
                            </th>
                            <th className="py-2 px-3 text-center border-r border-[#5b738b]">Nama Biaya</th>
                            <th className="py-2 px-3 text-center border-r border-[#5b738b] w-32">Kode #</th>
                            <th className="py-2 px-3 text-center w-32">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-warmgray-100">
                        {/* Empty State */}
                        {items.length === 0 && (
                            <tr>
                                <td className="py-1.5 px-2 text-center text-warmgray-400 bg-warmgray-50/30">=</td>
                                <td colSpan={3} className="py-4 text-center text-warmgray-500 italic">Belum ada data</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
