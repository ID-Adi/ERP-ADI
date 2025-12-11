'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import api from '@/lib/api';
import AccountForm from './AccountForm';

// Types
export interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  isHeader: boolean;
  level: number;
  parentId?: string;
  children?: Account[];
  currency?: string;
  isActive?: boolean;
}

const FEATURE_ID = '/dashboard/masters/akun-perkiraan';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  "ACCUMULATED_DEPRECIATION": "Akumulasi Penyusutan",
  "OTHER_ASSETS": "Aset Lainnya",
  "OTHER_CURRENT_ASSETS": "Aset Lancar Lainnya",
  "FIXED_ASSETS": "Aset Tetap",
  "EXPENSE": "Beban",
  "OTHER_EXPENSE": "Beban Lainnya",
  "COGS": "Beban Pokok Penjualan",
  "CASH_AND_BANK": "Kas & Bank",
  "LONG_TERM_LIABILITIES": "Liabilitas Jangka Panjang",
  "OTHER_CURRENT_LIABILITIES": "Liabilitas Jangka Pendek",
  "EQUITY": "Modal",
  "REVENUE": "Pendapatan",
  "OTHER_INCOME": "Pendapatan Lainnya",
  "INVENTORY": "Persediaan",
  "ACCOUNTS_RECEIVABLE": "Piutang Usaha",
  "ACCOUNTS_PAYABLE": "Utang Usaha"
};

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
        roots.push(node); // Fallback if parent missing
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function AccountView() {
  const {
    getActiveDataTab,
    openDataTab,
    closeDataTab,
    updateDataTabData
  } = useTabContext();

  const activeDataTab = getActiveDataTab();
  const activeTabId = activeDataTab?.id;

  const isListView = !activeTabId || activeTabId === `${FEATURE_ID}-list`;
  const isFormView = activeTabId && (activeTabId === `${FEATURE_ID}-new` || activeTabId.startsWith(`${FEATURE_ID}-edit-`));

  const editId = activeTabId?.startsWith(`${FEATURE_ID}-edit-`) ? activeTabId.replace(`${FEATURE_ID}-edit-`, '') : null;
  const isNew = activeTabId === `${FEATURE_ID}-new`;

  // --- List State ---
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // --- Fetch Data ---
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts', { params: { limit: 1000 } }); // Fetch all for tree
      if (res.data && res.data.data) {
        const tree = buildAccountTree(res.data.data);
        setAccounts(tree);
        // Auto expand roots initially if needed, or just keep collapsed
        if (expandedIds.size === 0) {
            const rootIds = tree.map(n => n.id);
            setExpandedIds(new Set(rootIds));
        }
      }
    } catch (error) {
      console.error('Failed to fetch accounts', error);
    } finally {
      setLoading(false);
    }
  }, [expandedIds.size]);

  useEffect(() => {
    fetchAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    fetchAccounts();
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const handleRowClick = (account: Account) => {
    openDataTab(FEATURE_ID, {
      id: `${FEATURE_ID}-edit-${account.id}`,
      title: account.name,
      href: FEATURE_ID
    });
  };

  const handleNewClick = () => {
    openDataTab(FEATURE_ID, {
      id: `${FEATURE_ID}-new`,
      title: 'Data Baru',
      href: FEATURE_ID
    });
  };

  const handleCloseForm = () => {
    if (activeTabId) {
      closeDataTab(FEATURE_ID, activeTabId);
    }
    handleRefresh();
  };

  // --- Flatten for Table ---
  const flattenAccounts = useCallback((nodes: Account[]): Account[] => {
    let result: Account[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0 && expandedIds.has(node.id)) {
        result = [...result, ...flattenAccounts(node.children)];
      }
    });
    return result;
  }, [expandedIds]);

  const visibleAccounts = useMemo(() => {
    const flat = flattenAccounts(accounts);
    if (!searchQuery) return flat;

    return flat.filter(acc =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery)
    );
  }, [accounts, flattenAccounts, searchQuery]);


  // --- Form Data Resolution ---
  const [editData, setEditData] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (isFormView && editId) {
        // If we already have the data for this ID, don't refetch
        if (editData && editData.id === editId) return;

        const loadAccount = async () => {
            setFormLoading(true);
            try {
                const res = await api.get(`/accounts/${editId}`);
                setEditData(res.data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setFormLoading(false);
            }
        };
        loadAccount();
    } else if (isNew) {
        setEditData(null);
    }
  }, [isFormView, editId, isNew, editData]);

  let formDataToRender = null;
  if (isNew) {
      formDataToRender = null; // Let form handle default
  } else if (editData && editData.id === editId) {
      formDataToRender = editData;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden relative">

      {/* FORM OVERLAY */}
      <div className={cn(
        "absolute inset-0 z-20 bg-white flex flex-col transition-opacity duration-200",
        isFormView ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none hidden"
      )}>
        {isFormView && (
            (editId && !formDataToRender && formLoading) ? (
                <div className="flex h-full items-center justify-center gap-2 text-warmgray-500">
                    <RefreshCw className="animate-spin h-6 w-6 text-primary-600" />
                    <span>Memuat data...</span>
                </div>
            ) : (
                <AccountForm
                    initialData={formDataToRender}
                    onSave={handleCloseForm}
                    onCancel={() => {
                        if (activeTabId) closeDataTab(FEATURE_ID, activeTabId);
                    }}
                />
            )
        )}
      </div>

      {/* LIST VIEW */}
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-surface-200 bg-surface-50 flex-none">
          <span className="text-xs font-semibold text-warmgray-500 uppercase tracking-wider">
              Masters / Akun Perkiraan
          </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
        <div className="flex items-center gap-2">
            <button
                onClick={handleNewClick}
                className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm transition-colors"
            >
                <Plus className="h-5 w-5" />
            </button>
            <button
                onClick={handleRefresh}
                className="flex items-center justify-center w-8 h-8 bg-white border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded-md shadow-sm transition-colors"
            >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex items-center border border-surface-300 rounded overflow-hidden bg-white">
                <span className="px-3 py-1.5 text-sm text-warmgray-500 bg-white">Cari...</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-32 px-2 py-1.5 text-sm bg-white border-l border-surface-200 focus:outline-none focus:ring-0 placeholder:text-warmgray-400"
                />
            </div>
             <div className="flex items-center justify-center h-8 px-3 border border-surface-300 bg-surface-50 text-warmgray-600 rounded text-xs font-medium whitespace-nowrap">
                {visibleAccounts.length} Data
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                <tr>
                    <th className="px-4 py-2 font-semibold w-64">Kode Perkiraan</th>
                    <th className="px-4 py-2 font-semibold">Nama Akun</th>
                    <th className="px-4 py-2 font-semibold w-48">Tipe</th>
                    <th className="px-4 py-2 font-semibold w-48 text-right">Saldo</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
                {visibleAccounts.map((account, index) => (
                    <tr
                        key={account.id}
                        className={cn(
                            "hover:bg-primary-50 transition-colors cursor-pointer group",
                            index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                        )}
                        onClick={() => handleRowClick(account)}
                    >
                        <td className="px-4 py-2 text-warmgray-900 align-top">
                             <span className={cn(account.isHeader ? "font-bold" : "")}>{account.code}</span>
                        </td>
                        <td className="px-4 py-2 align-top">
                            <div className="flex items-center" style={{ paddingLeft: `${account.level * 24}px` }}>
                                {account.children && account.children.length > 0 ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(account.id);
                                        }}
                                        className="mr-1 p-0.5 hover:bg-warmgray-200 rounded text-warmgray-500 transition-colors"
                                    >
                                        {expandedIds.has(account.id) ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>
                                ) : (
                                    // Spacer for items without children to align text
                                    <span className="w-5 mr-1 inline-block" />
                                )}
                                <span className={cn(
                                    "text-warmgray-800",
                                    account.isHeader ? "font-bold" : "font-medium"
                                )}>
                                    {account.name}
                                </span>
                            </div>
                        </td>
                        <td className="px-4 py-2 text-warmgray-600 align-top text-xs">
                            {ACCOUNT_TYPE_LABELS[account.type] || account.type.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-2 text-right align-top font-mono text-warmgray-900">
                             {formatCurrency(account.balance)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
