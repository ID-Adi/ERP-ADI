import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar as CalendarIcon, Search, Calculator } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
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

      const [mounted, setMounted] = useState(false);

      useEffect(() => {
            setMounted(true);
            return () => setMounted(false);
      }, []);

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

      // Mock branches for now
      const branches = [{ label: 'HEAD OFFICE', value: 'HEAD OFFICE' }];

      return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-primary-900 text-white">
                              <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">Saldo Awal</h3>
                              </div>
                              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                              </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                              <h4 className="text-danger-500 font-medium border-b border-danger-200 pb-1 mb-4">Rincian Barang</h4>

                              <div className="space-y-3">
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
                                          <DatePicker
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full"
                                          />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                          <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                      Kuantitas <span className="text-danger-500">*</span>
                                                </label>
                                                <div className="relative">
                                                      <input
                                                            type="number"
                                                            value={formData.quantity}
                                                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                                            className="w-full pl-3 pr-8 py-1.5 border border-warmgray-300 rounded focus:outline-none focus:ring-0 focus:border-primary-500 text-sm text-right font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                      />
                                                      <Calculator className="absolute right-2 top-2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                                                </div>
                                          </div>
                                          <SearchableSelect
                                                label="Satuan"
                                                value={formData.unit}
                                                onChange={(val) => setFormData({ ...formData, unit: val })}
                                                options={units.map(u => ({ label: u.name, value: u.name }))}
                                                placeholder="Cari/Pilih..."
                                          />
                                    </div>

                                    <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Biaya Satuan <span className="text-danger-500">*</span>
                                          </label>
                                          <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                      <span className="text-warmgray-500 text-xs">Rp</span>
                                                </div>
                                                <input
                                                      type="number"
                                                      value={formData.costPerUnit}
                                                      onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                                                      className="w-full pl-9 pr-8 py-1.5 border border-warmgray-300 rounded focus:outline-none focus:ring-0 focus:border-primary-500 text-sm text-right font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <Calculator className="absolute right-2 top-2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                                          </div>
                                    </div>

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
            </div>,
            document.body
      );
}
