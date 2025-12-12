import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertCircle, Calculator, Trash } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import DatePicker from '@/components/ui/DatePicker';

interface StockModalProps {
      isOpen: boolean;
      onClose: () => void;
      onSave: (data: any) => void;
      warehouses: any[];
      units: any[];
      initialData?: any;
      onDelete?: () => void;
}

export default function StockModal({ isOpen, onClose, onSave, warehouses, units, initialData, onDelete }: StockModalProps) {
      const [mounted, setMounted] = useState(false);
      const [formData, setFormData] = useState({
            id: '',
            branch: 'HEAD OFFICE',
            warehouseId: '',
            date: new Date().toISOString().split('T')[0],
            quantity: 0,
            unit: '',
            costPerUnit: 0,
            totalCost: 0
      });

      useEffect(() => {
            setMounted(true);
            return () => setMounted(false);
      }, []);

      useEffect(() => {
            if (isOpen) {
                  if (initialData) {
                        setFormData({
                              id: initialData.id || '',
                              branch: initialData.branch || 'HEAD OFFICE',
                              warehouseId: initialData.warehouseId || '',
                              date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                              quantity: Number(initialData.quantity) || 0,
                              unit: initialData.unit || '',
                              costPerUnit: Number(initialData.costPerUnit) || 0,
                              totalCost: Number(initialData.totalCost) || 0
                        });
                  } else {
                        // Reset for new entry
                        setFormData({
                              id: '',
                              branch: 'HEAD OFFICE',
                              warehouseId: '',
                              date: new Date().toISOString().split('T')[0],
                              quantity: 0,
                              unit: '',
                              costPerUnit: 0,
                              totalCost: 0
                        });
                  }
            }
      }, [isOpen, initialData]);

      // Auto-calculate total cost
      useEffect(() => {
            setFormData(prev => ({
                  ...prev,
                  totalCost: (prev.quantity || 0) * (prev.costPerUnit || 0)
            }));
      }, [formData.quantity, formData.costPerUnit]);

      if (!isOpen || !mounted) return null;

      const handleSave = () => {
            if (!formData.warehouseId) {
                  alert('Pilih gudang terlebih dahulu');
                  return;
            }
            if (!formData.unit) {
                  alert('Pilih satuan terlebih dahulu');
                  return;
            }
            onSave(formData);
            onClose();
      };

      const modalContent = (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 transition-all duration-300">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
                        {/* Header - Removed Save icon as requested */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-900 to-primary-800 text-white shadow-md">
                              <div>
                                    <h3 className="font-bold text-lg tracking-tight">{initialData ? 'Ubah Stok Awal' : 'Tambah Stok Awal'}</h3>
                                    <p className="text-xs text-primary-200 font-medium">Input saldo awal persediaan barang</p>
                              </div>
                              <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                              >
                                    <X className="h-5 w-5" />
                              </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5 bg-surface-50">
                              {/* Warning Alert */}
                              <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                                    <p>Perubahan stok awal akan mempengaruhi <strong>Nilai HPP</strong> dan <strong>Jurnal Akuntansi</strong> secara otomatis.</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                          <SearchableSelect
                                                label="Gudang"
                                                required
                                                value={formData.warehouseId}
                                                onChange={(val) => setFormData({ ...formData, warehouseId: val })}
                                                options={warehouses.map(w => ({ label: w.name, value: w.id }))}
                                                placeholder="Pilih lokasi penyimpanan..."
                                          />
                                    </div>

                                    <div className="col-span-1">
                                          <label className="block text-sm font-medium text-warmgray-700 mb-1">
                                                Tanggal <span className="text-danger-500">*</span>
                                          </label>
                                          <div className="relative">
                                                <DatePicker
                                                      value={formData.date}
                                                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                      className="w-full"
                                                />
                                          </div>
                                    </div>

                                    <div className="col-span-1">
                                          <SearchableSelect
                                                label="Satuan"
                                                value={formData.unit}
                                                onChange={(val) => setFormData({ ...formData, unit: val })}
                                                options={units.map(u => ({ label: u.name, value: u.name }))}
                                                placeholder="Pilih Satuan"
                                          />
                                    </div>

                                    <div className="col-span-1">
                                          <label className="block text-sm font-medium text-warmgray-700 mb-1">
                                                Kuantitas <span className="text-danger-500">*</span>
                                          </label>
                                          <div className="relative">
                                                <input
                                                      type="number"
                                                      value={formData.quantity === 0 ? '' : formData.quantity}
                                                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                                      onFocus={(e) => { if (formData.quantity === 0) setFormData({ ...formData, quantity: '' as any }); e.target.select(); }}
                                                      onBlur={(e) => { if (e.target.value === '' || isNaN(parseFloat(e.target.value))) setFormData({ ...formData, quantity: 0 }); }}
                                                      placeholder="0"
                                                      className="w-full pl-3 pr-8 h-[38px] border border-warmgray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <Calculator className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                                          </div>
                                    </div>

                                    <div className="col-span-1">
                                          <label className="block text-sm font-medium text-warmgray-700 mb-1">
                                                Biaya Satuan <span className="text-danger-500">*</span>
                                          </label>
                                          <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray-500 text-sm z-10">Rp</span>
                                                <input
                                                      type="number"
                                                      value={formData.costPerUnit === 0 ? '' : formData.costPerUnit}
                                                      onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                                                      onFocus={(e) => { if (formData.costPerUnit === 0) setFormData({ ...formData, costPerUnit: '' as any }); e.target.select(); }}
                                                      onBlur={(e) => { if (e.target.value === '' || isNaN(parseFloat(e.target.value))) setFormData({ ...formData, costPerUnit: 0 }); }}
                                                      placeholder="0"
                                                      className="w-full pl-9 pr-3 h-[38px] border border-warmgray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                          </div>
                                    </div>
                              </div>

                              {/* Total Container - Reduced size */}
                              <div className="flex justify-between items-center px-4 py-2.5 bg-primary-50 rounded border border-primary-100">
                                    <span className="text-sm font-semibold text-primary-800 uppercase tracking-wide">Total Nilai</span>
                                    <span className="text-lg font-bold text-primary-700">{formatCurrency(formData.totalCost)}</span>
                              </div>
                        </div>

                        {/* Footer - Removed Cancel button, Updated Save/Delete to match ItemsView footer */}
                        <div className="px-6 py-3 bg-white border-t border-warmgray-200 flex items-center justify-end gap-2">
                              {initialData && onDelete && (
                                    <button
                                          onClick={onDelete}
                                          className="p-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-lg shadow-sm transition-colors"
                                          type="button"
                                          title="Hapus"
                                    >
                                          <Trash className="h-5 w-5" />
                                    </button>
                              )}
                              <button
                                    onClick={handleSave}
                                    className="p-3 bg-[#d95d39] hover:bg-[#c44e2b] text-white border border-transparent rounded-lg shadow-md transition-colors"
                                    type="button"
                                    title="Simpan"
                              >
                                    <Save className="h-5 w-5" />
                              </button>
                        </div>
                  </div>
            </div>
      );

      return typeof document !== 'undefined'
            ? createPortal(modalContent, document.body)
            : null;
}
