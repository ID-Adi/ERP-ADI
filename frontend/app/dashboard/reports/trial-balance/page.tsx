'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, PageTransition } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Search, Download, ArrowLeft, Printer, RefreshCw, CheckCircle2, AlertCircle, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TrialBalanceItem {
    id: string;
    code: string;
    name: string;
    type: string;
    opening: { debit: number; credit: number; net: number };
    mutation: { debit: number; credit: number; net: number };
    ending: { debit: number; credit: number; net: number };
}

export default function TrialBalancePage() {
    const router = useRouter();
    const [data, setData] = useState<TrialBalanceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
        to: new Date().toISOString().split('T')[0], // Today
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Simulate delay for smooth UI feel if local
            // await new Promise(r => setTimeout(r, 500)); 

            const response = await fetch(
                `http://localhost:3001/api/reports/trial-balance?startDate=${dateRange.from}&endDate=${dateRange.to}`
            );
            if (response.ok) {
                const result = await response.json();
                setData(result.data);
            } else {
                console.error('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = () => {
        fetchData();
    };

    // Calculate totals
    const totals = data.reduce(
        (acc, item) => ({
            openingDebit: acc.openingDebit + item.opening.debit,
            openingCredit: acc.openingCredit + item.opening.credit,
            mutationDebit: acc.mutationDebit + item.mutation.debit,
            mutationCredit: acc.mutationCredit + item.mutation.credit,
            endingDebit: acc.endingDebit + item.ending.debit,
            endingCredit: acc.endingCredit + item.ending.credit,
        }),
        { openingDebit: 0, openingCredit: 0, mutationDebit: 0, mutationCredit: 0, endingDebit: 0, endingCredit: 0 }
    );

    const isBalanced = totals.endingDebit === totals.endingCredit;

    return (
        <PageTransition>
            <div className="space-y-6 max-w-[1600px] mx-auto pb-10">

                {/* Top Navigation & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm w-10 h-10 p-0 rounded-full"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Neraca Saldo</h1>
                            <p className="text-sm text-gray-500 font-medium">Laporan Keuangan / Trial Balance</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white gap-2 shadow-sm border-gray-200">
                            <Printer className="h-4 w-4 text-gray-500" />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                        <Button variant="primary" className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                            <Download className="h-4 w-4" />
                            <span>Export Excel</span>
                        </Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <Card className="p-1 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4 w-full lg:w-auto">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200 w-full lg:w-auto">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Periode:</span>
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-gray-900"
                                />
                                <span className="text-gray-400 mx-1">→</span>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <Button onClick={handleSearch} disabled={loading} className="w-full lg:w-auto gap-2">
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Tampilkan Data
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Summary Overview */}
                {!loading && data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="h-16 w-16 text-indigo-600" />
                            </div>
                            <p className="text-sm font-semibold text-indigo-600 mb-1">Total Debit Mutasi</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.mutationDebit)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingDown className="h-16 w-16 text-purple-600" />
                            </div>
                            <p className="text-sm font-semibold text-purple-600 mb-1">Total Kredit Mutasi</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.mutationCredit)}</p>
                        </div>

                        <div className={`p-5 rounded-xl border shadow-sm flex items-center gap-4 transition-all ${isBalanced ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100' : 'bg-gradient-to-br from-red-50 to-white border-red-100'}`}>
                            <div className={`p-3 rounded-full ${isBalanced ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {isBalanced ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                            </div>
                            <div>
                                <p className={`text-sm font-semibold mb-1 ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>Status Neraca</p>
                                <p className={`text-lg font-bold ${isBalanced ? 'text-emerald-900' : 'text-red-900'}`}>{isBalanced ? 'Balanced' : 'Unbalanced'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table Card */}
                <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-gray-200 sm:rounded-xl bg-white">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-gray-50/80 backdrop-blur">
                                <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                                    <th rowSpan={2} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">Akun</th>
                                    <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50">Saldo Awal</th>
                                    <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-blue-600 uppercase tracking-wider border-r border-gray-200 bg-blue-50/30">Mutasi</th>
                                    <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Saldo Akhir</th>
                                </TableRow>
                                <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 border-r border-gray-200 w-32">Debit</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 border-r border-gray-200 w-32">Kredit</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-600 border-r border-gray-200 w-32 bg-blue-50/30">Debit</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-blue-600 border-r border-gray-200 w-32 bg-blue-50/30">Kredit</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 border-r border-gray-200 w-32">Debit</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 w-32">Kredit</th>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></td>
                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div></td>
                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div></td>
                                            <td className="p-4 bg-blue-50/10"><div className="h-4 bg-blue-50 rounded w-full animate-pulse"></div></td>
                                            <td className="p-4 bg-blue-50/10"><div className="h-4 bg-blue-50 rounded w-full animate-pulse"></div></td>
                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div></td>
                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div></td>
                                        </TableRow>
                                    ))
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <td colSpan={7} className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileText className="h-12 w-12 text-gray-300 mb-3" />
                                                <p className="text-lg font-medium text-gray-900">Tidak ada data</p>
                                                <p className="text-sm">Silakan pilih periode lain atau tambahkan transaksi.</p>
                                            </div>
                                        </td>
                                    </TableRow>
                                ) : (
                                    <>
                                        {data.map((item, idx) => (
                                            <TableRow key={item.id} className={`group transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                                <td className="px-6 py-3 border-r border-gray-100">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-xs font-bold text-gray-500 mb-0.5">{item.code}</span>
                                                        <span className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors">{item.name}</span>
                                                    </div>
                                                </td>

                                                {/* Opening */}
                                                <td className="px-4 py-3 text-right text-sm text-gray-600 font-mono tracking-tight border-r border-gray-100">
                                                    {item.opening.debit !== 0 ? formatCurrency(item.opening.debit) : <span className="text-gray-300">-</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-600 font-mono tracking-tight border-r border-gray-100">
                                                    {item.opening.credit !== 0 ? formatCurrency(item.opening.credit) : <span className="text-gray-300">-</span>}
                                                </td>

                                                {/* Mutation */}
                                                <td className="px-4 py-3 text-right text-sm text-gray-700 font-mono tracking-tight font-medium bg-blue-50/10 border-r border-blue-50 group-hover:bg-blue-50/30">
                                                    {item.mutation.debit !== 0 ? formatCurrency(item.mutation.debit) : <span className="text-gray-300">-</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-700 font-mono tracking-tight font-medium bg-blue-50/10 border-r border-blue-50 group-hover:bg-blue-50/30">
                                                    {item.mutation.credit !== 0 ? formatCurrency(item.mutation.credit) : <span className="text-gray-300">-</span>}
                                                </td>

                                                {/* Ending */}
                                                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 font-mono tracking-tight border-r border-gray-100">
                                                    {item.ending.debit !== 0 ? formatCurrency(item.ending.debit) : <span className="text-gray-300">-</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 font-mono tracking-tight">
                                                    {item.ending.credit !== 0 ? formatCurrency(item.ending.credit) : <span className="text-gray-300">-</span>}
                                                </td>
                                            </TableRow>
                                        ))}
                                        {/* Footer / Totals Row */}
                                        <TableRow className="bg-gray-900 hover:bg-gray-900 border-t-2 border-primary-500">
                                            <td className="px-6 py-4 text-right font-bold text-white uppercase text-xs tracking-wider">Total</td>
                                            <td className="px-4 py-4 text-right font-mono text-sm font-bold text-gray-300 border-t border-gray-700">{formatCurrency(totals.openingDebit)}</td>
                                            <td className="px-4 py-4 text-right font-mono text-sm font-bold text-gray-300 border-t border-gray-700">{formatCurrency(totals.openingCredit)}</td>
                                            <td className="px-4 py-4 text-right font-mono text-sm font-bold text-white border-t border-gray-700 bg-white/5">{formatCurrency(totals.mutationDebit)}</td>
                                            <td className="px-4 py-4 text-right font-mono text-sm font-bold text-white border-t border-gray-700 bg-white/5">{formatCurrency(totals.mutationCredit)}</td>
                                            <td className="px-4 py-4 text-right font-mono text-sm font-bold text-emerald-400 border-t border-gray-700">{formatCurrency(totals.endingDebit)}</td>
                                            <td className="px-4 py-4 text-right font-mono text-sm font-bold text-emerald-400 border-t border-gray-700">{formatCurrency(totals.endingCredit)}</td>
                                        </TableRow>
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </PageTransition>
    );
}
