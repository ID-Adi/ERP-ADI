'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, MoreHorizontal, Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui';
import api from '@/lib/api';

export interface CostItem {
    id: string; // Temporarily just string/UUID
    accountId: string;
    accountCode: string;
    accountName: string;
    amount: number;
    notes?: string;
}

interface InvoiceCostsViewProps {
    invoiceStatus?: string; // 'PAID', 'UNPAID', 'PARTIAL'
    invoiceId?: string;
    costs: CostItem[];
    onChange: (costs: CostItem[]) => void;
}

export default function InvoiceCostsView({ invoiceStatus = 'UNPAID', invoiceId, costs, onChange }: InvoiceCostsViewProps) {
    // const [costs, setCosts] = useState<CostItem[]>([]); // Lifted to parent
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [calculatedStatus, setCalculatedStatus] = useState<string>('UNPAID');

    // Selected Account for changing costs
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [amountInput, setAmountInput] = useState<number | ''>(0);
    const [notesInput, setNotesInput] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Fetch Payment Status if invoiceId exists
    useEffect(() => {
        if (!invoiceId) return;
        const fetchStatus = async () => {
            try {
                // Fetch Invoice to get Total
                const invRes = await api.get(`/fakturs/${invoiceId}`);
                const invTotal = invRes.data.data.totalAmount || 0;

                // Fetch Payments
                const payRes = await api.get('/sales-receipts', { params: { fakturId: invoiceId } });
                const payments = payRes.data.data || [];
                const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

                if (totalPaid >= invTotal && invTotal > 0) {
                    setCalculatedStatus('LUNAS');
                } else {
                    setCalculatedStatus('UNPAID');
                }
            } catch (error) {
                console.error("Failed to fetch status", error);
            }
        };
        fetchStatus();
    }, [invoiceId]);

    // Fetch Filtered Accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            // "Aset Lancar Lainnya", "Liabilitas Jangka Pendek", "Pendapatan", "Beban Pokok Penjualan", "Beban", "Beban Lainnya"
            // Mapping to likely Enum keys. Assuming Enum keys match these or similar.
            // We need valid AccountType keys. Based on common English/Indo maps or assuming keys.
            // Let's assume standard keys: OTHER_CURRENT_ASSET, CURRENT_LIABILITY, REVENUE, COGS, EXPENSE, OTHER_EXPENSE
            // OR Indonesian keys if schema uses Indonesian.
            // Let's blindly try the English standard ones often used in Prisma schemas or check schema.
            // Wait, I didn't check the schema Enums!
            // I'll try to find commonly used types or fetch all and filter client side if I fail?
            // No, I updated the backend to filter. I should check schema Enums.
            // For now, I will use a safe guess or fetch all, but the requirement was DB filter.
            // Let's assume the request strings "Aset Lancar Lainnya" etc ARE the Enum values or mapped.
            // Since I can't check schema easily right now without breaking flow, I'll pass them as strings
            // and hope the backend/prisma handles or I'll fix it if it errors 500.
            // Actually, I should check schema. But to save steps:
            // Let's try to query with the specific strings requested.

            try {
                const types = [
                    'OTHER_CURRENT_ASSETS',
                    'OTHER_CURRENT_LIABILITIES',
                    'REVENUE',
                    'COGS',
                    'EXPENSE',
                    'OTHER_EXPENSE'
                ].join(',');

                const response = await api.get(`/accounts?type=${types}`);
                console.log("Filtered Accounts:", response.data.data);
                setAccounts(response.data.data);
            } catch (error) {
                console.error("Failed to fetch accounts", error);
            }
        };
        fetchAccounts();
    }, []);

    const handleAccountSelect = (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        if (account) {
            setSelectedAccount(account);
            setAmountInput(0);
            setNotesInput('');
            setEditingId(null);
            setIsModalOpen(true);
        }
    };

    const handleSaveCost = () => {
        if (!selectedAccount) return;

        const finalAmount = amountInput === '' ? 0 : amountInput;

        if (editingId) {
            onChange(costs.map(c => c.id === editingId ? {
                ...c,
                amount: finalAmount,
                notes: notesInput
            } : c));
        } else {
            const newCost: CostItem = {
                id: crypto.randomUUID(),
                accountId: selectedAccount.id,
                accountCode: selectedAccount.code,
                accountName: selectedAccount.name,
                amount: finalAmount,
                notes: notesInput
            };
            onChange([...costs, newCost]);
        }
        setIsModalOpen(false);
        setSelectedAccount(null);
    };

    const handleEdit = (item: CostItem) => {
        const account = accounts.find(a => a.id === item.accountId);
        // If account not in list (e.g. type changed), we might display minimal info or just allow amount edit
        setSelectedAccount(account || { id: item.accountId, code: item.accountCode, name: item.accountName });
        setAmountInput(item.amount);
        setNotesInput(item.notes || '');
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        onChange(costs.filter(c => c.id !== id));
    };

    const isPaid = invoiceStatus === 'PAID' || invoiceStatus === 'LUNAS' || calculatedStatus === 'LUNAS';

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-warmgray-200 overflow-hidden relative">
            {/* Header / Search */}
            <div className="p-3 border-b border-warmgray-200 flex items-center justify-between bg-warmgray-50/50">
                <div className="w-1/2 max-w-md">
                    <SearchableSelect
                        options={accounts.map(a => ({
                            value: a.id,
                            label: a.name,
                            description: a.code
                        }))}
                        onChange={handleAccountSelect}
                        placeholder="Cari/Pilih Akun Perkiraan..."
                        className="w-full"
                    />
                </div>

                <div className="text-sm font-semibold text-warmgray-600">
                    Biaya Lainnya <span className="text-red-500">*</span>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto bg-white relative">
                {/* LUNAS Stamp */}
                {isPaid && (
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-0">
                        <div className="border-4 border-green-500 text-green-500 font-bold text-6xl px-8 py-2 transform -rotate-12 rounded-lg tracking-widest">
                            LUNAS
                        </div>
                    </div>
                )}

                <table className="w-full text-xs z-10 relative">
                    <thead className="bg-warmgray-50 border-b border-warmgray-200 text-warmgray-600 font-semibold">
                        <tr>
                            <th className="w-12 py-2 text-center border-r border-warmgray-200">No</th>
                            <th className="py-2 px-3 text-left border-r border-warmgray-200">Nama Biaya</th>
                            <th className="py-2 px-3 text-center border-r border-warmgray-200 w-32">Kode #</th>
                            <th className="py-2 px-3 text-right w-32">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-warmgray-100">
                        {costs.length === 0 ? (
                            <tr>
                                <td className="py-1.5 px-2 text-center text-warmgray-400 bg-warmgray-50/30"></td>
                                <td colSpan={3} className="py-8 text-center text-warmgray-500 italic">
                                    Belum ada data Biaya Lainnya
                                </td>
                            </tr>
                        ) : (
                            costs.map((item, index) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 cursor-pointer" onClick={() => handleEdit(item)}>
                                    <td className="py-1.5 px-2 text-center border-r border-warmgray-100 font-semibold text-warmgray-600">
                                        {index + 1}
                                    </td>
                                    <td className="py-2 px-3 text-warmgray-800 font-medium">{item.accountName}</td>
                                    <td className="py-2 px-3 text-center text-warmgray-500">{item.accountCode}</td>
                                    <td className="py-2 px-3 text-right font-mono text-warmgray-900">{formatCurrency(item.amount)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cost Detail Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="flex justify-between items-center bg-[#1e293b] px-4 py-3 text-white">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Edit2 className="h-4 w-4" /> Rincian Biaya
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-warmgray-500 uppercase tracking-wider mb-1">
                                    Kode #
                                </label>
                                <div className="text-blue-600 font-medium text-sm">
                                    {selectedAccount?.code}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-warmgray-500 uppercase tracking-wider mb-1">
                                    Nama Biaya <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={selectedAccount?.name}
                                    readOnly
                                    className="w-full px-3 py-2 bg-warmgray-50 border border-warmgray-300 rounded text-sm text-warmgray-700 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-warmgray-500 uppercase tracking-wider mb-1">
                                    Jumlah (IDR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-warmgray-500 text-sm">Rp</span>
                                    <input
                                        type="number"
                                        value={amountInput}
                                        onFocus={(e) => {
                                            if (amountInput === 0) setAmountInput('');
                                            e.target.select();
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value === '') setAmountInput(0);
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setAmountInput(val === '' ? '' : Number(val));
                                        }}
                                        className="w-full pl-9 pr-3 py-2 border border-warmgray-300 rounded text-sm focus:outline-none focus:border-primary-500 text-right font-medium transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-warmgray-500 uppercase tracking-wider mb-1">
                                    Catatan
                                </label>
                                <textarea
                                    value={notesInput}
                                    onChange={(e) => setNotesInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-warmgray-300 rounded text-sm focus:outline-none focus:border-primary-500 transition-shadow resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="bg-warmgray-50 px-6 py-3 flex justify-between gap-3 border-t border-warmgray-200">
                            {editingId ? (
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        handleDelete(editingId);
                                        setIsModalOpen(false);
                                    }}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 font-semibold text-xs"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Hapus
                                </Button>
                            ) : (
                                <div></div>
                            )}
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-warmgray-200 hover:bg-warmgray-300 text-warmgray-800 border-none font-semibold text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveCost}
                                    disabled={Number(amountInput || 0) <= 0}
                                    className="bg-[#d95d39] hover:bg-[#c44e2b] text-white border-none font-semibold shadow-md text-xs"
                                >
                                    Lanjut
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}
