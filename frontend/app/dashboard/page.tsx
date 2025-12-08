'use client';

import { ArrowUp, ArrowDown, TrendingUp, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

// Dummy data untuk KPIs
const kpiData = [
  {
    title: 'Total Revenue',
    value: 'Rp 485.250.000',
    change: '+12.5%',
    isPositive: true,
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
  {
    title: 'Total Orders',
    value: '1,234',
    change: '+8.2%',
    isPositive: true,
    icon: ShoppingCart,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-100',
  },
  {
    title: 'Active Customers',
    value: '856',
    change: '+3.1%',
    isPositive: true,
    icon: Users,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-100',
  },
  {
    title: 'Products',
    value: '2,345',
    change: '-2.4%',
    isPositive: false,
    icon: Package,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
];

// Dummy data untuk recent transactions
const recentTransactions = [
  {
    id: 'INV-00123',
    customer: 'PT Maju Jaya',
    date: '2024-12-05',
    amount: 15750000,
    status: 'paid',
  },
  {
    id: 'INV-00122',
    customer: 'CV Berkah Sejahtera',
    date: '2024-12-04',
    amount: 8500000,
    status: 'pending',
  },
  {
    id: 'INV-00121',
    customer: 'PT Global Indonesia',
    date: '2024-12-03',
    amount: 22300000,
    status: 'paid',
  },
  {
    id: 'INV-00120',
    customer: 'UD Sentosa',
    date: '2024-12-02',
    amount: 5200000,
    status: 'overdue',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-warmgray-900">Dashboard</h1>
        <p className="text-sm text-warmgray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className={`p-5 hover:shadow-soft-lg transition-all duration-300 border-l-4 ${kpi.borderColor}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warmgray-500 uppercase tracking-wide">{kpi.title}</p>
                  <p className="text-2xl font-bold text-warmgray-900 mt-2">{kpi.value}</p>
                  <div className="flex items-center mt-2 gap-1.5">
                    {kpi.isPositive ? (
                      <ArrowUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm font-semibold ${kpi.isPositive ? 'text-emerald-600' : 'text-red-600'
                        }`}
                    >
                      {kpi.change}
                    </span>
                    <span className="text-xs text-warmgray-400 hidden sm:inline">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl flex-shrink-0 ${kpi.bgColor}`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts & Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales Chart Placeholder */}
        <Card title="Sales Overview" className="p-5">
          <div className="h-52 flex items-center justify-center bg-surface-100 rounded-xl border border-surface-300/30">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-warmgray-300 mx-auto mb-3" />
              <p className="text-sm text-warmgray-500">Chart will be displayed here</p>
              <p className="text-xs text-warmgray-400 mt-1">Connect to API for live data</p>
            </div>
          </div>
        </Card>

        {/* Top Products Placeholder */}
        <Card title="Top Products" className="p-5">
          <div className="space-y-3">
            {['Product A', 'Product B', 'Product C', 'Product D', 'Product E'].map(
              (product, index) => (
                <div
                  key={product}
                  className="flex items-center justify-between p-3 bg-surface-100 rounded-xl hover:bg-surface-200/80 transition-all duration-200 text-sm"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-warmgray-900">{product}</p>
                      <p className="text-xs text-warmgray-500">{(500 - index * 50)} units sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 flex-shrink-0 ml-3">
                    {formatCurrency((10000000 - index * 1000000))}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card title="Recent Transactions" className="p-5">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-surface-300/50 bg-surface-100/50">
                <th className="px-5 py-3 text-left font-semibold text-warmgray-600">Invoice</th>
                <th className="px-5 py-3 text-left font-semibold text-warmgray-600">Customer</th>
                <th className="px-5 py-3 text-left font-semibold text-warmgray-600">Date</th>
                <th className="px-5 py-3 text-right font-semibold text-warmgray-600">Amount</th>
                <th className="px-5 py-3 text-center font-semibold text-warmgray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-300/30">
              {recentTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-surface-100/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <span className="font-medium text-primary-600">{transaction.id}</span>
                  </td>
                  <td className="px-5 py-3 text-warmgray-900">{transaction.customer}</td>
                  <td className="px-5 py-3 text-warmgray-500">{transaction.date}</td>
                  <td className="px-5 py-3 text-right font-semibold text-warmgray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${transaction.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : transaction.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
