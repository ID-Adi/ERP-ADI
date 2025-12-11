'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, X, Search, Check, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface AccountFormProps {
  initialData?: any;
  onSave: () => void;
  onCancel: () => void;
}

const ACCOUNT_TYPES = [
  { value: "ACCUMULATED_DEPRECIATION", label: "Akumulasi Penyusutan" },
  { value: "OTHER_ASSETS", label: "Aset Lainnya" },
  { value: "OTHER_CURRENT_ASSETS", label: "Aset Lancar Lainnya" },
  { value: "FIXED_ASSETS", label: "Aset Tetap" },
  { value: "EXPENSE", label: "Beban" },
  { value: "OTHER_EXPENSE", label: "Beban Lainnya" },
  { value: "COGS", label: "Beban Pokok Penjualan" },
  { value: "CASH_AND_BANK", label: "Kas & Bank" },
  { value: "LONG_TERM_LIABILITIES", label: "Liabilitas Jangka Panjang" },
  { value: "OTHER_CURRENT_LIABILITIES", label: "Liabilitas Jangka Pendek" },
  { value: "EQUITY", label: "Modal" },
  { value: "REVENUE", label: "Pendapatan" },
  { value: "OTHER_INCOME", label: "Pendapatan Lainnya" },
  { value: "INVENTORY", label: "Persediaan" },
  { value: "ACCOUNTS_RECEIVABLE", label: "Piutang Usaha" },
  { value: "ACCOUNTS_PAYABLE", label: "Utang Usaha" }
];

export default function AccountForm({ initialData, onSave, onCancel }: AccountFormProps) {
  const isEdit = !!initialData?.id;
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState<'umum' | 'saldo' | 'lain'>('umum');

  // Form State
  const [formData, setFormData] = useState({
    type: 'CASH_AND_BANK',
    isSubAccount: false,
    parentId: '',
    parentName: '', // For display
    parentCode: '', // For auto-coding logic
    code: '',
    name: '',
    currency: 'IDR',
    autoCode: false,
    ...initialData
  });

  // Ensure isSubAccount logic syncs with data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        isSubAccount: !!initialData.parentId,
        parentId: initialData.parentId || '',
        parentName: initialData.parent?.name || '',
        parentCode: initialData.parent?.code || '',
        type: initialData.type || 'CASH_AND_BANK' // Ensure type is set
      }));
    }
  }, [initialData]);

  // Parent Dropdown State
  const [parentOptions, setParentOptions] = useState<any[]>([]);
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Parents
  useEffect(() => {
    if (formData.isSubAccount && parentOptions.length === 0) {
      api.get('/accounts/dropdown').then(res => {
        setParentOptions(res.data.data || []);
      });
    }
  }, [formData.isSubAccount, parentOptions.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowParentDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter Parents (Circular Check)
  const filteredParents = parentOptions.filter(p => {
    // Exclude self
    if (isEdit && p.id === initialData.id) return false;
    // Exclude children (This requires a recursive check or backend flag, simpler check for now: don't select if parentId is this account)
    if (isEdit && p.parentId === initialData.id) return false;

    // Search filter
    const search = parentSearch.toLowerCase();
    return p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search);
  });

  const handleParentSelect = (parent: any) => {
    setFormData(prev => ({
      ...prev,
      parentId: parent.id,
      parentName: parent.name,
      parentCode: parent.code,
      type: parent.type, // Inherit type
      code: prev.autoCode ? `${parent.code}.` : prev.code // Basic prefix logic
    }));
    setShowParentDropdown(false);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      alert('Mohon lengkapi Kode dan Nama');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        parentId: formData.isSubAccount ? formData.parentId : null,
        isHeader: false, // Default
        currency: formData.currency
      };

      if (isEdit) {
        await api.put(`/accounts/${initialData.id}`, payload);
      } else {
        await api.post('/accounts', payload);
      }
      onSave();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      if(!confirm('Apakah anda yakin ingin menghapus akun ini?')) return;
      setLoading(true);
      try {
          await api.delete(`/accounts/${initialData.id}`);
          onSave(); // Treat as save/refresh
      } catch (error: any) {
          alert(error.response?.data?.error || 'Gagal menghapus');
      } finally {
          setLoading(false);
      }
  }

  return (
    <div className="flex flex-col h-full bg-surface-50">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 pt-2 bg-white border-b border-surface-200">
         <div className="flex gap-1">
            {(['umum', 'saldo', 'lain'] as const).map(tab => (
            <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-md border-t border-l border-r border-transparent relative top-[1px] capitalize transition-colors",
                subTab === tab
                    ? "bg-surface-50 border-surface-200 text-primary-600 border-b-surface-50"
                    : "bg-white text-warmgray-500 hover:text-warmgray-700"
                )}
            >
                {tab === 'umum' ? 'Informasi Umum' : tab === 'saldo' ? 'Saldo' : 'Lain-lain'}
            </button>
            ))}
         </div>

         <div className="flex gap-2 pb-2">
            {isEdit && (
                <Button
                    variant="danger"
                    className="h-8 text-xs bg-red-100 text-red-700 hover:bg-red-200 border-transparent shadow-none"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    Hapus
                </Button>
            )}
            <Button
                variant="secondary"
                className="h-8 text-xs"
                onClick={onCancel}
            >
                <X className="h-3 w-3 mr-1" /> Batal
            </Button>
            <Button
                variant="primary"
                className="h-8 text-xs bg-primary-600 hover:bg-primary-700"
                onClick={handleSave}
                disabled={loading}
            >
                <Save className="h-3 w-3 mr-1" /> Simpan
            </Button>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-surface-200 max-w-4xl mx-auto">
             {subTab === 'umum' && (
                 <div className="space-y-6">
                     {/* Tipe Akun */}
                     <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                        <label className="text-sm font-medium text-warmgray-700">Tipe Akun</label>
                        <select
                            className="w-full max-w-md px-3 py-2 border border-surface-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                            {ACCOUNT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                     </div>

                     {/* Sub Akun Row (Checkbox & Search) */}
                     <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
                        <div className="flex items-center gap-2 mt-2">
                             <input
                                type="checkbox"
                                id="isSubAccount"
                                className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                checked={formData.isSubAccount}
                                onChange={e => setFormData({...formData, isSubAccount: e.target.checked})}
                             />
                             <label htmlFor="isSubAccount" className="text-sm font-medium text-warmgray-700 cursor-pointer select-none">Sub Akun</label>
                        </div>

                        <div className="space-y-3">
                             {/* Only show Parent Search if Checked */}
                             {formData.isSubAccount && (
                                 <div className="relative max-w-md" ref={dropdownRef}>
                                     <div
                                        className="flex items-center w-full border border-surface-300 rounded overflow-hidden bg-white focus-within:ring-1 focus-within:ring-primary-500"
                                        onClick={() => {
                                            setShowParentDropdown(true);
                                            // Focus input
                                        }}
                                     >
                                         <input
                                            type="text"
                                            className="flex-1 px-3 py-2 text-sm focus:outline-none"
                                            placeholder="Cari/Pilih Akun Induk..."
                                            value={showParentDropdown ? parentSearch : formData.parentName}
                                            onChange={e => {
                                                setParentSearch(e.target.value);
                                                setShowParentDropdown(true);
                                            }}
                                         />
                                         <Search className="h-4 w-4 text-warmgray-400 mr-2" />
                                     </div>

                                     {/* Dropdown Results */}
                                     {showParentDropdown && (
                                         <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded shadow-lg z-50 max-h-60 overflow-auto">
                                             {filteredParents.length > 0 ? filteredParents.map(parent => (
                                                 <div
                                                    key={parent.id}
                                                    className="px-3 py-2 text-sm hover:bg-surface-50 cursor-pointer border-b border-surface-50 last:border-0"
                                                    onClick={() => handleParentSelect(parent)}
                                                 >
                                                     <div className="font-medium text-warmgray-900">{parent.code} - {parent.name}</div>
                                                     <div className="text-xs text-warmgray-500">{ACCOUNT_TYPES.find(t => t.value === parent.type)?.label}</div>
                                                 </div>
                                             )) : (
                                                 <div className="px-3 py-2 text-sm text-warmgray-500">Tidak ada data</div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             )}
                        </div>
                     </div>

                     {/* Kode Perkiraan */}
                     <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
                        <label className="text-sm font-medium text-warmgray-700 mt-2">Kode Perkiraan <span className="text-red-500">*</span></label>
                        <div className="space-y-2">
                             {formData.isSubAccount && (
                                 <div className="flex items-center gap-2">
                                     <input
                                        type="checkbox"
                                        id="autoCode"
                                        className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        checked={formData.autoCode}
                                        onChange={e => {
                                            const newVal = e.target.checked;
                                            setFormData(prev => ({
                                                ...prev,
                                                autoCode: newVal,
                                                code: newVal && prev.parentCode ? `${prev.parentCode}.` : prev.code
                                            }));
                                        }}
                                     />
                                     <label htmlFor="autoCode" className="text-sm text-warmgray-600 cursor-pointer select-none">Pengkodean otomatis dengan prefix kode akun induk</label>
                                 </div>
                             )}
                             <Input
                                className="max-w-md font-mono"
                                value={formData.code}
                                onChange={(e: any) => setFormData({...formData, code: e.target.value})}
                                placeholder="Contoh: 1-1001"
                             />
                        </div>
                     </div>

                     {/* Nama */}
                     <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                        <label className="text-sm font-medium text-warmgray-700">Nama <span className="text-red-500">*</span></label>
                        <Input
                            className="max-w-md w-full"
                            value={formData.name}
                            onChange={(e: any) => setFormData({...formData, name: e.target.value})}
                            placeholder="Contoh: Kas Kecil"
                        />
                     </div>

                     {/* Mata Uang */}
                     <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                        <label className="text-sm font-medium text-warmgray-700">Mata Uang</label>
                         <div className="relative max-w-xs">
                             <select
                                className="w-full px-3 py-2 border border-surface-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white appearance-none"
                                value={formData.currency}
                                onChange={e => setFormData({...formData, currency: e.target.value})}
                             >
                                 <option value="IDR">Indonesian Rupiah (IDR)</option>
                                 <option value="USD">US Dollar (USD)</option>
                                 <option value="SGD">Singapore Dollar (SGD)</option>
                             </select>
                             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                         </div>
                     </div>

                     <div className="grid grid-cols-[160px_1fr] gap-4 items-center pt-4">
                        <div />
                        <p className="text-xs text-warmgray-400 italic">
                            Contoh: BCA a/c XXX-XXX, dll
                        </p>
                     </div>
                 </div>
             )}

             {subTab === 'saldo' && (
                 <div className="py-12 text-center text-warmgray-500">
                     <p>Fitur Saldo Awal akan segera hadir.</p>
                 </div>
             )}

             {subTab === 'lain' && (
                 <div className="space-y-6">
                     <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
                        <label className="text-sm font-medium text-warmgray-700 mt-2">Catatan</label>
                        <textarea
                            className="w-full max-w-md px-3 py-2 border border-surface-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 h-24 resize-none"
                            placeholder="Tambahkan catatan tambahan..."
                        />
                     </div>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
}
