'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, FileText, Download, Calendar, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { Button, Card, Badge, PageTransition } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Dummy Trial Balance data
const trialBalanceData = [
  { code: '1110', name: 'Cash on Hand', debit: 50000000, credit: 0 },
  { code: '1120', name: 'Bank BCA', debit: 200000000, credit: 0 },
  { code: '1130', name: 'Accounts Receivable', debit: 100000000, credit: 0 },
  { code: '1210', name: 'Equipment', debit: 100000000, credit: 0 },
  { code: '1220', name: 'Vehicles', debit: 50000000, credit: 0 },
  { code: '2100', name: 'Accounts Payable', debit: 0, credit: 75000000 },
  { code: '2200', name: 'Taxes Payable', debit: 0, credit: 25000000 },
  { code: '2300', name: 'Bank Loan', debit: 0, credit: 50000000 },
  { code: '3100', name: 'Capital Stock', debit: 0, credit: 300000000 },
  { code: '3200', name: 'Retained Earnings', debit: 0, credit: 50000000 },
  { code: '4100', name: 'Sales Revenue', debit: 0, credit: 200000000 },
  { code: '4200', name: 'Service Revenue', debit: 0, credit: 50000000 },
  { code: '5100', name: 'Cost of Goods Sold', debit: 120000000, credit: 0 },
  { code: '5200', name: 'Operating Expenses', debit: 60000000, credit: 0 },
];

// Balance Sheet data
const balanceSheetData = {
  assets: {
    current: [
      { name: 'Cash on Hand', amount: 50000000 },
      { name: 'Bank BCA', amount: 200000000 },
      { name: 'Accounts Receivable', amount: 100000000 },
    ],
    fixed: [
      { name: 'Equipment', amount: 100000000 },
      { name: 'Vehicles', amount: 50000000 },
    ],
  },
  liabilities: [
    { name: 'Accounts Payable', amount: 75000000 },
    { name: 'Taxes Payable', amount: 25000000 },
    { name: 'Bank Loan', amount: 50000000 },
  ],
  equity: [
    { name: 'Capital Stock', amount: 300000000 },
    { name: 'Retained Earnings', amount: 50000000 },
  ],
};

// Income Statement data
const incomeStatementData = {
  revenue: [
    { name: 'Sales Revenue', amount: 200000000 },
    { name: 'Service Revenue', amount: 50000000 },
  ],
  expenses: [
    { name: 'Cost of Goods Sold', amount: 120000000 },
    { name: 'Operating Expenses', amount: 60000000 },
  ],
};

type ReportType = 'trial-balance' | 'balance-sheet' | 'income-statement';

export default function ReportsPage() {
  const router = useRouter();
  const [activeReport, setActiveReport] = useState<ReportType>('trial-balance');
  const [dateRange, setDateRange] = useState({
    from: '2024-01-01',
    to: '2024-12-31',
  });

  const totalDebit = trialBalanceData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = trialBalanceData.reduce((sum, item) => sum + item.credit, 0);

  const totalAssets =
    balanceSheetData.assets.current.reduce((sum, item) => sum + item.amount, 0) +
    balanceSheetData.assets.fixed.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = balanceSheetData.liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = balanceSheetData.equity.reduce((sum, item) => sum + item.amount, 0);

  const totalRevenue = incomeStatementData.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = incomeStatementData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  const reportTabs = [
    { id: 'trial-balance', name: 'Trial Balance', icon: BarChart3 },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: FileText },
    { id: 'income-statement', name: 'Income Statement', icon: TrendingUp },
  ];

  const handleTabClick = (id: string) => {
    if (id === 'balance-sheet') {
      router.push('/dashboard/reports/balance-sheet');
    } else if (id === 'income-statement') {
      router.push('/dashboard/reports/income-statement');
    } else {
      setActiveReport(id as ReportType);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-down">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-gray-600">View and export financial statements</p>
            </div>
          </div>
          <Button variant="primary" className="gap-2 btn-press">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>

        {/* Report Tabs */}
        <Card className="animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Tabs */}
            <div className="flex gap-2">
              {reportTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 btn-press ${activeReport === tab.id && tab.id !== 'balance-sheet' && tab.id !== 'income-statement'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm input-glow"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm input-glow"
              />
            </div>
          </div>
        </Card>

        {/* Trial Balance */}
        {activeReport === 'trial-balance' && (
          <div className="space-y-4 animate-fade-in-up">
            <Card title="Trial Balance" description={`Period: ${dateRange.from} to ${dateRange.to}`}>
              <Table>
                <TableHeader>
                  <TableRow hoverable={false}>
                    <TableHead>Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalanceData.map((item, index) => (
                    <TableRow key={item.code} className="table-row-animate" style={{ animationDelay: `${index * 30}ms` }}>
                      <TableCell className="font-mono text-primary-600">{item.code}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                      <TableCell className="text-right">{item.debit > 0 ? formatCurrency(item.debit) : '-'}</TableCell>
                      <TableCell className="text-right">{item.credit > 0 ? formatCurrency(item.credit) : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {totalDebit === totalCredit && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <Badge variant="success">Balanced</Badge>
                  <span className="text-green-800 text-sm">Debit equals Credit</span>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Link href="/dashboard/reports/trial-balance">
                  <Button className="gap-2">
                    <FileText className="h-4 w-4" />
                    View Detailed Trial Balance
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Balance Sheet */}
        {activeReport === 'balance-sheet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
            {/* Assets */}
            <Card title="Assets" className="card-hover">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Current Assets</h4>
                  <div className="space-y-2">
                    {balanceSheetData.assets.current.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex justify-between py-2 border-b border-gray-100 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Fixed Assets</h4>
                  <div className="space-y-2">
                    {balanceSheetData.assets.fixed.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex justify-between py-2 border-b border-gray-100 animate-fade-in"
                        style={{ animationDelay: `${(index + 3) * 50}ms` }}
                      >
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between py-3 bg-blue-50 px-3 rounded-lg font-bold">
                  <span className="text-blue-800">Total Assets</span>
                  <span className="text-blue-800">{formatCurrency(totalAssets)}</span>
                </div>
              </div>
            </Card>

            {/* Liabilities & Equity */}
            <Card title="Liabilities & Equity" className="card-hover">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Liabilities</h4>
                  <div className="space-y-2">
                    {balanceSheetData.liabilities.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex justify-between py-2 border-b border-gray-100 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between py-2 mt-2 font-semibold">
                    <span className="text-gray-700">Total Liabilities</span>
                    <span className="text-red-600">{formatCurrency(totalLiabilities)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Equity</h4>
                  <div className="space-y-2">
                    {balanceSheetData.equity.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex justify-between py-2 border-b border-gray-100 animate-fade-in"
                        style={{ animationDelay: `${(index + 3) * 50}ms` }}
                      >
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between py-2 mt-2 font-semibold">
                    <span className="text-gray-700">Total Equity</span>
                    <span className="text-green-600">{formatCurrency(totalEquity)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-3 bg-purple-50 px-3 rounded-lg font-bold">
                  <span className="text-purple-800">Total Liab. + Equity</span>
                  <span className="text-purple-800">{formatCurrency(totalLiabilities + totalEquity)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
