import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';

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
      const [formData, setFormData] = useState({
            id: '',
            branch: 'HEAD OFFICE',
            warehouseId: '',
            date: new Date().toISOString().split('T')[0],
            quantity: 1,
            unit: '',
            costPerUnit: 0,
            totalCost: 0
      });

      useEffect(() => {
            if (isOpen) {
                  if (initialData) {
                        setFormData({
                              id: initialData.id || '',
                              branch: initialData.branch || 'HEAD OFFICE',
                              warehouseId: initialData.warehouseId || '',
                              date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                              quantity: Number(initialData.quantity) || 1,
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
                              quantity: 1,
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
                  totalCost: prev.quantity * prev.costPerUnit
            }));
      }, [formData.quantity, formData.costPerUnit]);

      if (!isOpen) return null;

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

      const branches = [{ label: 'HEAD OFFICE', value: 'HEAD OFFICE' }];

      return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-900 to-primary-800 text-white shadow-md">
                              <div className="flex items-center gap-3">
                                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                          <Save className="h-5 w-5 text-primary-100" />
                                    </div>
                                    <div>
                                          <h3 className="font-bold text-lg tracking-tight">{initialData ? 'Ubah Stok Awal' : 'Tambah Stok Awal'}</h3>
                                          <p className="text-xs text-primary-200 font-medium">Input saldo awal persediaan barang</p>
                                    </div>
                              </div>
                              <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                              >
                                    <X className="h-5 w-5" />
                              </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6 bg-surface-50">
                              {/* Warning Alert */}
                              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                                    <p>Perubahan stok awal akan mempengaruhi <strong>Nilai HPP</strong> dan <strong>Jurnal Akuntansi</strong> secara otomatis.</p>
                              </div>

                              <div className="grid grid-cols-2 gap-5">
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
                                          <label className="block text-sm font-semibold text-warmgray-700 mb-1.5">
                                                Tanggal <span className="text-danger-500">*</span>
                                          </label>
                                          <div className="relative">
                                                <input
                                                      type="date"
                                                      className="form-input w-full pl-3 pr-3 py-2.5 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                                                      value={formData.date}
                                                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                                          <Input
                                                label="Kuantitas"
                                                required
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                                className="font-mono text-right"
                                          />
                                    </div>

                                    <div className="col-span-1">
                                          <Input
                                                label="Biaya Satuan"
                                                required
                                                type="number"
                                                value={formData.costPerUnit}
                                                onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                                                prefix="Rp"
                                                className="font-mono text-right"
                                          />
                                    </div>
                              </div>

                              <div className="pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center p-4 bg-primary-50 rounded-xl border border-primary-100">
                                          <span className="text-sm font-bold text-primary-800 uppercase tracking-wider">Total Nilai</span>
                                          <span className="text-xl font-bold text-primary-700 font-mono">{formatCurrency(formData.totalCost)}</span>
                                    </div>
                              </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-between gap-3">
                              <div>
                                    {initialData && onDelete && (
                                          <button
                                                onClick={onDelete}
                                                className="px-5 py-2.5 text-danger-600 font-medium hover:bg-danger-50 rounded-lg transition-colors border border-transparent hover:border-danger-200"
                                          >
                                                Hapus
                                          </button>
                                    )}
                              </div>
                              <div className="flex gap-3">
                                    <button
                                          onClick={onClose}
                                          className="px-5 py-2.5 text-warmgray-600 font-medium hover:bg-warmgray-50 rounded-lg transition-colors"
                                    >
                                          Batal
                                    </button>
                                    <button
                                          onClick={handleSave}
                                          className="px-6 py-2.5 bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-lg hover:from-primary-800 hover:to-primary-700 transition-all font-semibold shadow-lg shadow-primary-500/30 transform active:scale-95"
                                    >
                                          Simpan Data
                                    </button>
                              </div>
                        </div>
                  </div>
            </div>
      );
}
