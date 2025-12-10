'use client';

import React, { useState } from 'react';
import { X, Save, Trash, Paperclip, Printer, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import SearchableSelect from '@/components/ui/SearchableSelect'; // Assuming this exists
import { useTabContext } from '@/contexts/TabContext';
import api from '@/lib/api';

import { createPortal } from 'react-dom';

function Tooltip({ children, text }: { children: React.ReactNode, text: string }) {
      const [show, setShow] = useState(false);
      const [pos, setPos] = useState({ top: 0, left: 0 });

      const handleMouseEnter = (e: React.MouseEvent) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPos({
                  top: rect.top - 8, // 8px gap above
                  left: rect.left + rect.width / 2
            });
            setShow(true);
      };

      return (
            <>
                  <div onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)} className="flex">
                        {children}
                  </div>
                  {show && typeof document !== 'undefined' && createPortal(
                        <div
                              className="fixed px-2 py-1 text-xs text-white bg-gray-800 rounded pointer-events-none z-[9999] -translate-x-1/2 -translate-y-full whitespace-nowrap shadow-sm"
                              style={{ top: pos.top, left: pos.left }}
                        >
                              {text}
                        </div>,
                        document.body
                  )}
            </>
      )
}

interface EmployeeFormProps {
      initialData?: any;
      onCancel: () => void;
}

export default function EmployeeForm({ initialData, onCancel }: EmployeeFormProps) {
      const isEdit = !!initialData;
      const [submitting, setSubmitting] = useState(false);
      const [activeTab, setActiveTab] = useState('karyawan');

      // Form State
      const [formData, setFormData] = useState({
            fullName: initialData?.fullName || '',
            salutation: initialData?.salutation || '',
            position: initialData?.position || '',
            email: initialData?.email || '',
            mobilePhone: initialData?.mobilePhone || '',
            businessPhone: initialData?.businessPhone || '',
            homePhone: initialData?.homePhone || '',
            whatsapp: initialData?.whatsapp || '',
            website: initialData?.website || '',
            citizenship: initialData?.citizenship || 'Indonesia',
            employeeIdType: initialData?.employeeIdType || 'Karyawan',
            isEmployeeIdAuto: initialData?.isEmployeeIdAuto ?? true,
            joinDate: initialData?.joinDate || new Date().toISOString().split('T')[0],
            idCardNumber: initialData?.idCardNumber || '',
            branch: initialData?.branch || 'HEAD OFFICE',
            isSalesperson: initialData?.isSalesperson || false,
            notes: initialData?.notes || '',
      });

      const handleChange = (field: string, value: any) => {
            setFormData(prev => ({ ...prev, [field]: value }));
      };

      const handleSave = async () => {
            if (!formData.fullName) {
                  alert('Nama Lengkap wajib diisi');
                  return;
            }

            setSubmitting(true);
            try {
                  if (isEdit) {
                        await api.put(`/employees/${initialData.id}`, formData);
                        alert('Data karyawan berhasil diperbarui');
                  } else {
                        await api.post('/employees', formData);
                        alert('Data karyawan berhasil disimpan');
                  }
                  onCancel();
            } catch (error: any) {
                  console.error('Error saving employee:', error);
                  alert(error.response?.data?.error || 'Gagal menyimpan data karyawan');
            } finally {
                  setSubmitting(false);
            }
      };

      const handleDelete = async () => {
            if (!isEdit || !initialData?.id) return;
            if (!confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) return;

            setSubmitting(true);
            try {
                  await api.delete(`/employees/${initialData.id}`);
                  alert('Data karyawan berhasil dihapus');
                  onCancel();
            } catch (error: any) {
                  console.error('Error deleting employee:', error);
                  alert(error.response?.data?.error || 'Gagal menghapus data karyawan');
            } finally {
                  setSubmitting(false);
            }
      };

      const tabs = [
            { id: 'karyawan', label: 'Karyawan' },
            { id: 'alamat', label: 'Alamat' },
            { id: 'pajak', label: 'Pajak Penghasilan' },
            { id: 'rekening', label: 'Rekening Gaji' },
      ];

      return (
            <div className="flex flex-col h-full bg-surface-50">
                  {/* Header / Toolbar */}
                  <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-surface-200 flex-none relative z-50">
                        <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-surface-100 rounded-t-lg px-4 py-2 border-t border-x border-surface-200 -mb-[13px] z-10 relative bg-white">
                                    <span className="text-sm font-medium text-warmgray-900">{isEdit ? 'Edit Data' : 'Data Baru'}</span>
                                    <button onClick={onCancel} className="ml-2 text-warmgray-400 hover:text-warmgray-600">
                                          <X className="h-3 w-3" />
                                    </button>
                              </div>
                        </div>
                        <div className="flex items-center gap-2">
                              {isEdit && (
                                    <Tooltip text="Hapus">
                                          <button
                                                onClick={handleDelete}
                                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded shadow-sm border border-red-200"
                                          >
                                                <Trash className="h-5 w-5" />
                                          </button>
                                    </Tooltip>
                              )}
                              <Tooltip text="Simpan">
                                    <button
                                          onClick={handleSave}
                                          className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-sm"
                                    >
                                          <Save className="h-5 w-5" />
                                    </button>
                              </Tooltip>
                              <Tooltip text="Cetak">
                                    <button className="p-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded shadow-sm border border-primary-200">
                                          <Printer className="h-5 w-5" />
                                    </button>
                              </Tooltip>
                              <Tooltip text="Lampiran">
                                    <button className="p-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded shadow-sm border border-primary-200">
                                          <Paperclip className="h-5 w-5" />
                                    </button>
                              </Tooltip>
                              <Tooltip text="Pengaturan">
                                    <button className="p-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded shadow-sm border border-primary-200">
                                          <Settings className="h-5 w-5" />
                                    </button>
                              </Tooltip>
                        </div>
                  </div>

                  {/* Main Toolbar (Yellow/Red buttons in image? No, standard save is fine, but let's match the header style from image if possible. 
               The image shows a "Data Baru" tab active. And a "Karyawan" sub-tab active.
               Let's replicate the sub-tabs.
            */}

                  {/* Sub Tabs */}
                  <div className="px-6 pt-4 bg-surface-100 border-b border-surface-200 flex-none">
                        <div className="flex items-center gap-1">
                              {tabs.map((tab) => (
                                    <button
                                          key={tab.id}
                                          onClick={() => setActiveTab(tab.id)}
                                          className={cn(
                                                "px-4 py-2 text-sm font-medium border-t border-x rounded-t-lg transition-colors relative top-[1px]",
                                                activeTab === tab.id
                                                      ? "bg-white border-surface-200 text-warmgray-900 border-b-white z-10"
                                                      : "bg-surface-200 border-transparent text-warmgray-500 hover:text-warmgray-700"
                                          )}
                                    >
                                          {tab.label}
                                    </button>
                              ))}
                        </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-auto p-6 bg-white">
                        <div className="max-w-7xl mx-auto">
                              {activeTab === 'karyawan' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                          {/* Left Column */}
                                          <div className="space-y-4">
                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">
                                                            Nama Lengkap <span className="text-red-500">*</span>
                                                      </label>
                                                      <div className="flex gap-2">
                                                            <select
                                                                  value={formData.salutation}
                                                                  onChange={(e) => handleChange('salutation', e.target.value)}
                                                                  className="form-select w-32"
                                                            >
                                                                  <option value="">- Sapaan -</option>
                                                                  <option value="Bapak">Bapak</option>
                                                                  <option value="Ibu">Ibu</option>
                                                                  <option value="Nona">Nona</option>
                                                            </select>
                                                            <input
                                                                  type="text"
                                                                  value={formData.fullName}
                                                                  onChange={(e) => handleChange('fullName', e.target.value)}
                                                                  className="form-input flex-1"
                                                            />
                                                      </div>
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">Posisi Jabatan</label>
                                                      <input
                                                            type="text"
                                                            value={formData.position}
                                                            onChange={(e) => handleChange('position', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">Email</label>
                                                      <input
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => handleChange('email', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">Handphone</label>
                                                      <input
                                                            type="text"
                                                            value={formData.mobilePhone}
                                                            onChange={(e) => handleChange('mobilePhone', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">No. Telp. Bisnis</label>
                                                      <input
                                                            type="text"
                                                            value={formData.businessPhone}
                                                            onChange={(e) => handleChange('businessPhone', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">No. Telp. Rumah</label>
                                                      <input
                                                            type="text"
                                                            value={formData.homePhone}
                                                            onChange={(e) => handleChange('homePhone', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">No. WhatsApp</label>
                                                      <input
                                                            type="text"
                                                            value={formData.whatsapp}
                                                            onChange={(e) => handleChange('whatsapp', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">Website</label>
                                                      <input
                                                            type="text"
                                                            value={formData.website}
                                                            onChange={(e) => handleChange('website', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>
                                          </div>

                                          {/* Right Column */}
                                          <div className="space-y-4">
                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">Kewarganegaraan</label>
                                                      <select
                                                            value={formData.citizenship}
                                                            onChange={(e) => handleChange('citizenship', e.target.value)}
                                                            className="form-select w-full"
                                                      >
                                                            <option value="Indonesia">Indonesia</option>
                                                            <option value="Asing">Asing</option>
                                                      </select>
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">ID Karyawan</label>
                                                      <div className="flex items-center gap-2">
                                                            {/* Toggle Switch Simulation */}
                                                            <button
                                                                  type="button"
                                                                  onClick={() => handleChange('isEmployeeIdAuto', !formData.isEmployeeIdAuto)}
                                                                  className={cn(
                                                                        "w-10 h-5 rounded-full relative transition-colors",
                                                                        formData.isEmployeeIdAuto ? "bg-blue-600" : "bg-gray-300"
                                                                  )}
                                                            >
                                                                  <div className={cn(
                                                                        "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform",
                                                                        formData.isEmployeeIdAuto ? "left-5" : "left-0.5"
                                                                  )} />
                                                            </button>
                                                            <select
                                                                  value={formData.employeeIdType}
                                                                  onChange={(e) => handleChange('employeeIdType', e.target.value)}
                                                                  className="form-select flex-1"
                                                            >
                                                                  <option value="Karyawan">Karyawan</option>
                                                                  <option value="Lainnya">Lainnya</option>
                                                            </select>
                                                      </div>
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">Tgl Masuk</label>
                                                      <input
                                                            type="date"
                                                            value={formData.joinDate}
                                                            onChange={(e) => handleChange('joinDate', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">No. KTP</label>
                                                      <input
                                                            type="text"
                                                            value={formData.idCardNumber}
                                                            onChange={(e) => handleChange('idCardNumber', e.target.value)}
                                                            className="form-input w-full"
                                                      />
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">Cabang</label>
                                                      <select
                                                            value={formData.branch}
                                                            onChange={(e) => handleChange('branch', e.target.value)}
                                                            className="form-select w-full"
                                                      >
                                                            <option value="HEAD OFFICE">HEAD OFFICE</option>
                                                      </select>
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700">Penjual</label>
                                                      <div className="flex items-center gap-2">
                                                            <input
                                                                  type="checkbox"
                                                                  checked={formData.isSalesperson}
                                                                  onChange={(e) => handleChange('isSalesperson', e.target.checked)}
                                                                  className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300"
                                                            />
                                                            <span className="text-sm text-warmgray-700">Ya</span>
                                                      </div>
                                                </div>

                                                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                                                      <label className="text-sm font-medium text-warmgray-700 pt-2">Catatan</label>
                                                      <textarea
                                                            value={formData.notes}
                                                            onChange={(e) => handleChange('notes', e.target.value)}
                                                            className="form-textarea w-full h-24"
                                                      />
                                                </div>
                                          </div>
                                    </div>
                              )}
                              {activeTab !== 'karyawan' && (
                                    <div className="flex items-center justify-center h-64 text-warmgray-400">
                                          <p>Konten untuk tab {tabs.find(t => t.id === activeTab)?.label} belum tersedia.</p>
                                    </div>
                              )}
                        </div>
                  </div>
            </div>
      );
}
