'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Filter,
  Printer,
  Download,
  RefreshCw,
  Settings,
  FileDown,
  Check,
  Save,
  X,
  Calendar,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  DataTableContainer,
  ScrollableTableBody
} from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatCurrency, cn } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import api from '@/lib/api';

// Types
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

const ACCOUNTS_FEATURE_ID = '/dashboard/masters/akun-perkiraan';

const ACCOUNT_TYPES = [
  "Akumulasi Penyusutan",
  "Aset Lainnya",
  "Aset Lancar Lainnya",
  "Aset Tetap",
  "Beban",
  "Beban Lainnya",
  "Beban Pokok Penjualan",
  "Kas & Bank",
  "Liabilitas Jangka Panjang",
  "Liabilitas Jangka Pendek",
  "Modal",
  "Pendapatan",
  "Pendapatan Lainnya",
  "Persediaan",
  "Piutang Usaha",
  "Utang Usaha"
];

// Account Tree Builder
function buildAccountTree(flatAccounts: any[]): Account[] {
  const accountMap = new Map();
  const roots: Account[] = [];

  // 1. Initialize map
  flatAccounts.forEach(acc => {
    accountMap.set(acc.id, {
      ...acc,
      balance: Number(acc.balance) || 0,
      children: []
    });
  });

  // 2. Build Hierarchy
  flatAccounts.forEach(acc => {
    const node = accountMap.get(acc.id);
    if (acc.parentId) {
      const parent = accountMap.get(acc.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function AccountsPage() {
  const { getActiveDataTab, openDataTab, closeDataTab } = useTabContext();
  const activeDataTab = getActiveDataTab();
  const activeTabId = activeDataTab?.id;

  const isListView = !activeTabId || activeTabId === `${ACCOUNTS_FEATURE_ID}-list`;
  const isCreateView = activeTabId === `${ACCOUNTS_FEATURE_ID}-new`;

  const handleNewClick = () => {
    openDataTab(ACCOUNTS_FEATURE_ID, {
      id: `${ACCOUNTS_FEATURE_ID}-new`,
      title: 'Data Baru',
      href: ACCOUNTS_FEATURE_ID
    });
  };

  const handleCloseCreate = () => {
    closeDataTab(ACCOUNTS_FEATURE_ID, `${ACCOUNTS_FEATURE_ID}-new`);
  };

  return (
    <div className="h-full bg-white">
      {isListView && <ListView onNewClick={handleNewClick} />}
      {isCreateView && <CreateView onClose={handleCloseCreate} />}
    </div>
  );
}

function ListView({ onNewClick }: { onNewClick: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const typeFilterRef = useRef<HTMLDivElement>(null);

  // Click Outside for Filter
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setShowTypeFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts');
      if (res.data && res.data.data) {
        const tree = buildAccountTree(res.data.data);
        setAccounts(tree);
        setExpandedIds(tree.map(n => n.id)); // Auto expand roots
      }
    } catch (error) {
      console.error('Failed to fetch accounts', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleTypeSelection = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // ... (rest of logic same)

  const flattenAccounts = useCallback((accounts: Account[]): Account[] => {
    let result: Account[] = [];
    accounts.forEach(account => {
      result.push(account);
      if (account.children && account.children.length > 0 && expandedIds.includes(account.id)) {
        result = [...result, ...flattenAccounts(account.children)];
      }
    });
    return result;
  }, [expandedIds]);

  const flattenedData = useMemo(() => flattenAccounts(accounts), [accounts, flattenAccounts]);

  // ...


  const displayedAccounts = flattenedData.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || acc.code.includes(searchQuery);
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(acc.type);
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-sm z-10 sticky top-0">
        {/* Left Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 h-8 bg-white border border-surface-300 rounded text-sm text-gray-700 hover:border-surface-400 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex items-center">
                <option>Non Aktif: Semua</option>
                <option>Ya</option>
                <option>Tidak</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Custom Account Type Filter */}
            <div className="relative" ref={typeFilterRef}>
              <button
                onClick={() => setShowTypeFilter(!showTypeFilter)}
                className="flex items-center justify-between w-48 pl-3 pr-2 h-8 bg-white border border-surface-300 rounded text-sm text-gray-700 hover:border-surface-400 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
              >
                <span className="truncate">
                  {selectedTypes.length === 0 ? "Tipe Akun: Semua" : `Tipe Akun: ${selectedTypes.length} terpilih`}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showTypeFilter && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-1 space-y-0.5">
                    {ACCOUNT_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            className="peer h-4 w-4 border-2 border-gray-300 rounded bg-white checked:bg-primary-600 checked:border-primary-600 focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                            checked={selectedTypes.includes(type)}
                            onChange={() => toggleTypeSelection(type)}
                          />
                          <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center justify-center h-8 w-8 border border-surface-300 bg-white text-warmgray-600 rounded hover:bg-surface-100 transition-colors">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-300 rounded bg-white text-gray-600">
            <Tooltip text="Download">
              <button className="flex items-center justify-center w-8 h-8 hover:bg-gray-50 border-r border-gray-300 transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip text="Export">
              <button className="flex items-center justify-center w-8 h-8 hover:bg-gray-50 border-r border-gray-300 transition-colors">
                <FileDown className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip text="Cetak">
              <button className="flex items-center justify-center w-8 h-8 hover:bg-gray-50 border-r border-gray-300 transition-colors">
                <Printer className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip text="Pengaturan">
              <button className="flex items-center justify-center w-8 h-8 hover:bg-gray-50 transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          {/* Search */}
          <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white">
            <span className="px-3 py-1.5 text-sm text-gray-500 bg-white flex items-center">Cari...</span>
            <input
              type="text"
              placeholder=""
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 px-2 py-1.5 text-sm bg-white border-l border-gray-300 focus:outline-none focus:ring-0 placeholder:text-gray-400"
            />
          </div>

          <button className="flex items-center justify-center w-8 h-[34px] border border-gray-300 hover:bg-gray-50 text-gray-500 rounded bg-white transition-colors">
            <Search className="h-4 w-4" />
          </button>

          <span className="text-sm text-gray-600 font-medium min-w-[40px] text-right">{displayedAccounts.length.toLocaleString()}</span>
        </div>
      </div>

      {/* Secondary Toolbar */}
      <div className="px-4 py-2 flex items-center gap-2">
        <Button
          variant="primary"
          className="gap-1 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-sm h-8"
          onClick={onNewClick}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <button className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded bg-white transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
        <DataTableContainer height="100%" className="rounded border border-gray-300 shadow-sm bg-white flex flex-col">
          <div className="overflow-hidden bg-[#526C88] text-white flex-none">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#526C88] text-white">
                <tr>
                  <th className="px-3 py-2 border-r border-white/20 font-medium w-48 text-sm">Kode Perkiraan</th>
                  <th className="px-3 py-2 border-r border-white/20 font-medium text-sm">Nama</th>
                  <th className="px-3 py-2 border-r border-white/20 font-medium w-64 text-sm">Tipe Akun</th>
                  <th className="px-3 py-2 font-medium w-48 text-right text-sm">Saldo</th>
                </tr>
              </thead>
            </table>
          </div>

          <ScrollableTableBody className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left border-collapse">
              <tbody className="bg-white">
                {displayedAccounts.map((account, index) => (
                  <tr
                    key={account.id}
                    className={cn(
                      "border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    )}
                  >
                    <td className="px-3 py-1.5 text-gray-900 w-48 align-top border-r border-gray-100">
                      {account.code}
                    </td>
                    <td className="px-3 py-1.5 border-r border-gray-100 align-top">
                      <div className="flex items-center" style={{ paddingLeft: `${account.level * 20}px` }}>
                        {account.children && account.children.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(account.id);
                            }}
                            className="mr-1 p-0.5 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                          >
                            {expandedIds.includes(account.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        <span className={cn(
                          "text-gray-800",
                          account.isHeader && account.level === 0 ? "font-bold" : "font-medium"
                        )}>
                          {account.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-gray-700 w-64 align-top border-r border-gray-100">
                      {account.type}
                    </td>
                    <td className="px-3 py-1.5 text-right w-48 align-top font-mono text-[13px]">
                      <span className={cn(
                        account.balance < 0 ? "text-red-600" : "text-gray-900"
                      )}>
                        {account.balance < 0 ? `(${formatCurrency(Math.abs(account.balance))})` : formatCurrency(account.balance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTableBody>
        </DataTableContainer>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE VIEW ("Data Baru")
// ============================================================================

// Enum Map
const ACCOUNT_TYPE_MAP: Record<string, string> = {
  "Akumulasi Penyusutan": "ACCUMULATED_DEPRECIATION",
  "Aset Lainnya": "OTHER_ASSETS",
  "Aset Lancar Lainnya": "OTHER_CURRENT_ASSETS",
  "Aset Tetap": "FIXED_ASSETS",
  "Beban": "EXPENSE",
  "Beban Lainnya": "OTHER_EXPENSE",
  "Beban Pokok Penjualan": "COGS",
  "Kas & Bank": "CASH_AND_BANK",
  "Liabilitas Jangka Panjang": "LONG_TERM_LIABILITIES",
  "Liabilitas Jangka Pendek": "OTHER_CURRENT_LIABILITIES",
  "Modal": "EQUITY",
  "Pendapatan": "REVENUE",
  "Pendapatan Lainnya": "OTHER_INCOME",
  "Persediaan": "INVENTORY",
  "Piutang Usaha": "ACCOUNTS_RECEIVABLE",
  "Utang Usaha": "ACCOUNTS_PAYABLE"
};

function CreateView({ onClose }: { onClose: () => void }) {
  const [subTab, setSubTab] = useState<'umum' | 'saldo' | 'lain'>('umum');
  const [formData, setFormData] = useState({
    type: 'Kas & Bank',
    isSubAccount: false,
    code: '',
    name: '',
    currency: 'IDR',
    parentId: '',
    balance: 0,
    box: '', // For balance logic if needed
    date: '2024-01-01'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      alert('Mohon lengkapi data wajib (Kode dan Nama)');
      return;
    }

    try {
      setSaving(true);
      await api.post('/accounts', {
        code: formData.code,
        name: formData.name,
        type: ACCOUNT_TYPE_MAP[formData.type] || 'OTHER_ASSETS',
        parentId: formData.isSubAccount ? formData.parentId : null,
        isHeader: false, // Default to detail for now
        // balance: formData.balance // Backend ignored balance
      });
      onClose();
      // Trigger refresh somehow? ideally context refresh or simple reload
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Gagal menyimpan akun');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Sub Tabs */}
      <div className="bg-surface-100 border-b border-gray-200 flex items-end px-4 gap-1 pt-2">
        {(['umum', 'saldo', 'lain'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-md border-t border-l border-r border-transparent relative top-[1px] capitalize",
              subTab === tab
                ? "bg-white border-gray-200 text-gray-900 z-10"
                : "bg-surface-200 text-gray-500 hover:bg-surface-300"
            )}
          >
            {tab === 'umum' ? 'Informasi Umum' : tab === 'saldo' ? 'Saldo' : 'Lain-lain'}
          </button>
        ))}
      </div>

      {/* Top Right Save Button */}
      <div className="absolute top-2 right-4 z-50">
        <Button
          variant="secondary"
          className="w-10 h-10 p-0 rounded-full shadow-sm border-gray-300"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white p-8 overflow-auto">
        <div className="max-w-4xl">
          {subTab === 'umum' && (
            <div className="space-y-4">
              {/* Tipe Akun */}
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-sm text-gray-700">Tipe Akun</label>
                <select
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Sub Akun */}
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <div />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.isSubAccount}
                    onChange={e => setFormData({ ...formData, isSubAccount: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Sub Akun</span>
                </label>
              </div>

              {/* Kode Perkiraan */}
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-sm text-gray-700">Kode Perkiraan <span className="text-red-500">*</span></label>
                <Input
                  className="max-w-md"
                  value={formData.code}
                  onChange={(e: any) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              {/* Nama */}
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-sm text-gray-700">Nama <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-4 w-full max-w-md">
                  <Input
                    className="w-full"
                    value={formData.name}
                    onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          {/* Other tabs omitted for brevity but logic is prepared */}
        </div>
      </div>
    </div>
  );
}

function Tooltip({ text, children }: { text: string, children: React.ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-warmgray-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        {text}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-warmgray-800" />
      </div>
    </div>
  );
}
