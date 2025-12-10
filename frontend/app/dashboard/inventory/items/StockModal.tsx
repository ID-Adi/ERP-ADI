import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Search } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import DatePicker from '@/components/ui/DatePicker'; // Assuming we have this, or use input type='date'

interface StockModalProps {
      isOpen: boolean;
      onClose: () => void;
      onSave: (data: any) => void;
      warehouses: any[];
      units: any[];
}

export default function StockModal({ isOpen, onClose, onSave, warehouses, units }: StockModalProps) {
      const [formData, setFormData] = useState({
            branch: 'HEAD OFFICE', // Default or derived
            warehouseId: '',
            date: new Date().toISOString().split('T')[0],
            quantity: 1,
            unit: '',
            costPerUnit: 0,
            totalCost: 0
      });

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

      // Mock branches for now
      const branches = [{ label: 'HEAD OFFICE', value: 'HEAD OFFICE' }];

      return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-primary-900 text-white">
                              <div className="flex items-center gap-2">
                                    <span className="bg-white/20 p-1 rounded-full">
                                          <span className="text-xs font-bold">i</span>
                                    </span>
                                    <h3 className="font-semibold">Saldo Awal</h3>
                              </div>
                              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                              </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                              <h4 className="text-danger-500 font-medium border-b border-danger-200 pb-1 mb-4">Rincian Barang</h4>

                              <div className="space-y-3">
                                    <SearchableSelect
                                          label="Cabang"
                                          required
                                          value={formData.branch}
                                          onChange={(val) => setFormData({ ...formData, branch: val })}
                                          options={branches}
                                          placeholder="Pilih Cabang..."
                                    />

                                    <SearchableSelect
                                          label="Gudang"
                                          required
                                          value={formData.warehouseId}
                                          onChange={(val) => setFormData({ ...formData, warehouseId: val })}
                                          options={warehouses.map(w => ({ label: w.name, value: w.id }))}
                                          placeholder="Pilih Gudang..."
                                    />

                                    <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tanggal <span className="text-danger-500">*</span>
                                          </label>
                                          <input
                                                type="date"
                                                className="form-input w-full"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                          />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                          <Input
                                                label="Kuantitas"
                                                required
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                          />
                                          <SearchableSelect
                                                label="Satuan"
                                                value={formData.unit}
                                                onChange={(val) => setFormData({ ...formData, unit: val })}
                                                options={units.map(u => ({ label: u.name, value: u.name }))}
                                                placeholder="Cari/Pilih..."
                                          />
                                    </div>

                                    <Input
                                          label="Biaya Satuan"
                                          required
                                          type="number"
                                          value={formData.costPerUnit}
                                          onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                                          prefix="Rp"
                                    />

                                    <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Biaya</label>
                                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right text-gray-700">
                                                {formatCurrency(formData.totalCost)}
                                          </div>
                                    </div>
                              </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                              <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800 transition-colors font-medium"
                              >
                                    Lanjut
                              </button>
                        </div>
                  </div>
            </div>
      );
}
