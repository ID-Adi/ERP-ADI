'use client';

import { useState } from 'react';
import { Plus, Search, ChevronRight, ChevronDown, Wallet, Edit, Trash2 } from 'lucide-react';
import { Button, Card, Badge, PageTransition, useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  isHeader: boolean;
  level: number;
  parentId?: string;
  children?: Account[];
}

// Dummy Chart of Accounts
const dummyAccounts: Account[] = [
  {
    id: '1',
    code: '1000',
    name: 'Assets',
    type: 'ASSET',
    balance: 500000000,
    isHeader: true,
    level: 0,
    children: [
      {
        id: '1-1',
        code: '1100',
        name: 'Current Assets',
        type: 'ASSET',
        balance: 350000000,
        isHeader: true,
        level: 1,
        parentId: '1',
        children: [
          { id: '1-1-1', code: '1110', name: 'Cash on Hand', type: 'ASSET', balance: 50000000, isHeader: false, level: 2, parentId: '1-1' },
          { id: '1-1-2', code: '1120', name: 'Bank BCA', type: 'ASSET', balance: 200000000, isHeader: false, level: 2, parentId: '1-1' },
          { id: '1-1-3', code: '1130', name: 'Accounts Receivable', type: 'ASSET', balance: 100000000, isHeader: false, level: 2, parentId: '1-1' },
        ],
      },
      {
        id: '1-2',
        code: '1200',
        name: 'Fixed Assets',
        type: 'ASSET',
        balance: 150000000,
        isHeader: true,
        level: 1,
        parentId: '1',
        children: [
          { id: '1-2-1', code: '1210', name: 'Equipment', type: 'ASSET', balance: 100000000, isHeader: false, level: 2, parentId: '1-2' },
          { id: '1-2-2', code: '1220', name: 'Vehicles', type: 'ASSET', balance: 50000000, isHeader: false, level: 2, parentId: '1-2' },
        ],
      },
    ],
  },
  {
    id: '2',
    code: '2000',
    name: 'Liabilities',
    type: 'LIABILITY',
    balance: 150000000,
    isHeader: true,
    level: 0,
    children: [
      { id: '2-1', code: '2100', name: 'Accounts Payable', type: 'LIABILITY', balance: 75000000, isHeader: false, level: 1, parentId: '2' },
      { id: '2-2', code: '2200', name: 'Taxes Payable', type: 'LIABILITY', balance: 25000000, isHeader: false, level: 1, parentId: '2' },
      { id: '2-3', code: '2300', name: 'Bank Loan', type: 'LIABILITY', balance: 50000000, isHeader: false, level: 1, parentId: '2' },
    ],
  },
  {
    id: '3',
    code: '3000',
    name: 'Equity',
    type: 'EQUITY',
    balance: 350000000,
    isHeader: true,
    level: 0,
    children: [
      { id: '3-1', code: '3100', name: 'Capital Stock', type: 'EQUITY', balance: 300000000, isHeader: false, level: 1, parentId: '3' },
      { id: '3-2', code: '3200', name: 'Retained Earnings', type: 'EQUITY', balance: 50000000, isHeader: false, level: 1, parentId: '3' },
    ],
  },
  {
    id: '4',
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    balance: 250000000,
    isHeader: true,
    level: 0,
    children: [
      { id: '4-1', code: '4100', name: 'Sales Revenue', type: 'REVENUE', balance: 200000000, isHeader: false, level: 1, parentId: '4' },
      { id: '4-2', code: '4200', name: 'Service Revenue', type: 'REVENUE', balance: 50000000, isHeader: false, level: 1, parentId: '4' },
    ],
  },
  {
    id: '5',
    code: '5000',
    name: 'Expenses',
    type: 'EXPENSE',
    balance: 180000000,
    isHeader: true,
    level: 0,
    children: [
      { id: '5-1', code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', balance: 120000000, isHeader: false, level: 1, parentId: '5' },
      { id: '5-2', code: '5200', name: 'Operating Expenses', type: 'EXPENSE', balance: 60000000, isHeader: false, level: 1, parentId: '5' },
    ],
  },
];

export default function AccountsPage() {
  const { addToast } = useToast();
  const [accounts] = useState(dummyAccounts);
  const [expandedIds, setExpandedIds] = useState<string[]>(['1', '1-1', '2', '3', '4', '5']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET': return 'bg-blue-100 text-blue-800';
      case 'LIABILITY': return 'bg-red-100 text-red-800';
      case 'EQUITY': return 'bg-green-100 text-green-800';
      case 'REVENUE': return 'bg-purple-100 text-purple-800';
      case 'EXPENSE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAccount = (account: Account) => {
    const isExpanded = expandedIds.includes(account.id);
    const hasChildren = account.children && account.children.length > 0;

    return (
      <div key={account.id} className="animate-fade-in">
        <div
          className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 ${
            account.isHeader ? 'bg-gray-50' : ''
          }`}
          style={{ paddingLeft: `${account.level * 24 + 16}px` }}
        >
          {/* Expand/Collapse Button */}
          <div className="w-6">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(account.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
          </div>

          {/* Code */}
          <div className="w-24">
            <span className={`font-mono text-sm ${account.isHeader ? 'font-bold text-gray-900' : 'text-primary-600'}`}>
              {account.code}
            </span>
          </div>

          {/* Name */}
          <div className="flex-1">
            <span className={`${account.isHeader ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {account.name}
            </span>
          </div>

          {/* Type */}
          <div className="w-24">
            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getTypeColor(account.type)}`}>
              {account.type}
            </span>
          </div>

          {/* Balance */}
          <div className="w-40 text-right">
            <span className={`font-medium ${account.isHeader ? 'text-gray-900' : 'text-gray-700'}`}>
              {formatCurrency(account.balance)}
            </span>
          </div>

          {/* Actions */}
          <div className="w-20 flex justify-end gap-1">
            {!account.isHeader && (
              <>
                <Button variant="ghost" size="sm" className="btn-press">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="btn-press text-danger-600 hover:bg-danger-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="animate-fade-in-down">
            {account.children!.map((child) => renderAccount(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-down">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
              <p className="text-gray-600">Manage your general ledger accounts</p>
            </div>
          </div>
          <Button variant="primary" className="gap-2 btn-press" onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 stagger-children">
          {[
            { label: 'Assets', value: 500000000, color: 'text-blue-600' },
            { label: 'Liabilities', value: 150000000, color: 'text-red-600' },
            { label: 'Equity', value: 350000000, color: 'text-green-600' },
            { label: 'Revenue', value: 250000000, color: 'text-purple-600' },
            { label: 'Expenses', value: 180000000, color: 'text-orange-600' },
          ].map((item) => (
            <Card key={item.label} className="card-hover">
              <div className="text-center">
                <p className="text-sm text-gray-600">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Search & Actions */}
        <Card className="animate-fade-in">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg input-glow transition-all duration-200"
              />
            </div>
            <Button
              variant="outline"
              className="btn-press"
              onClick={() => setExpandedIds(['1', '1-1', '1-2', '2', '3', '4', '5'])}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              className="btn-press"
              onClick={() => setExpandedIds([])}
            >
              Collapse All
            </Button>
          </div>
        </Card>

        {/* Accounts Tree */}
        <Card className="animate-fade-in-up overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 border-b border-gray-200 font-medium text-sm text-gray-600">
            <div className="w-6"></div>
            <div className="w-24">Code</div>
            <div className="flex-1">Account Name</div>
            <div className="w-24">Type</div>
            <div className="w-40 text-right">Balance</div>
            <div className="w-20"></div>
          </div>

          {/* Account Rows */}
          <div className="divide-y divide-gray-100">
            {accounts.map((account) => renderAccount(account))}
          </div>
        </Card>

        {/* New Account Modal */}
        <Modal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          title="Add New Account"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                className="btn-press"
                onClick={() => {
                  setShowNewModal(false);
                  addToast({ type: 'success', title: 'Account Created', message: 'New account has been added.' });
                }}
              >
                Save Account
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Account Code" placeholder="e.g., 1150" required className="input-glow" />
            <Input label="Account Name" placeholder="e.g., Petty Cash" required className="input-glow" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow">
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Account</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg input-glow">
                <option value="">No Parent (Top Level)</option>
                <option value="1100">1100 - Current Assets</option>
                <option value="1200">1200 - Fixed Assets</option>
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
