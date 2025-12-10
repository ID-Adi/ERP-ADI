'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Filter, Settings, FileDown, Printer, Import, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface EmployeeListProps {
      onNewClick: () => void;
      onEdit: (employee: any) => void;
}

export default function EmployeeList({ onNewClick, onEdit }: EmployeeListProps) {
      const [employees, setEmployees] = useState<any[]>([]);
      const [loading, setLoading] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');

      const fetchEmployees = useCallback(async () => {
            setLoading(true);
            try {
                  const response = await api.get('/employees', {
                        params: { search: searchQuery }
                  });
                  setEmployees(response.data.data || []);
            } catch (error) {
                  console.error('Error fetching employees:', error);
            } finally {
                  setLoading(false);
            }
      }, [searchQuery]);

      useEffect(() => {
            fetchEmployees();
      }, [fetchEmployees]);

      return (
            <div className="flex flex-col h-full">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200 flex-none">
                        {/* Left: Add & Refresh */}
                        <div className="flex items-center gap-1">
                              <button
                                    onClick={onNewClick}
                                    className="flex items-center justify-center w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                              >
                                    <Plus className="h-4 w-4" />
                              </button>
                              <button
                                    onClick={fetchEmployees}
                                    className="flex items-center justify-center w-8 h-8 border border-surface-300 hover:bg-surface-100 text-warmgray-600 rounded transition-colors bg-white"
                              >
                                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                              </button>
                        </div>

                        {/* Right: Actions & Search */}
                        <div className="flex items-center gap-2">
                              {/* Search */}
                              <div className="flex items-center border border-surface-300 rounded overflow-hidden bg-white">
                                    <span className="px-3 py-1.5 text-sm text-warmgray-500 bg-white">Cari...</span>
                                    <input
                                          type="text"
                                          placeholder=""
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                          className="w-32 px-2 py-1.5 text-sm bg-white border-l border-surface-200 focus:outline-none focus:ring-0 placeholder:text-warmgray-400"
                                    />
                              </div>
                        </div>
                  </div>

                  {/* Table */}
                  <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                              <thead className="text-xs text-white uppercase bg-warmgray-800 sticky top-0 z-10">
                                    <tr>
                                          <th className="px-4 py-3">Nama Lengkap</th>
                                          <th className="px-4 py-3">Posisi</th>
                                          <th className="px-4 py-3">Email</th>
                                          <th className="px-4 py-3">Handphone</th>
                                          <th className="px-4 py-3">Cabang</th>
                                          <th className="px-4 py-3">Status</th>
                                    </tr>
                              </thead>
                              <tbody className="divide-y divide-surface-200">
                                    {employees.map((employee, index) => (
                                          <tr
                                                key={employee.id}
                                                onClick={() => onEdit(employee)}
                                                className={cn(
                                                      "hover:bg-primary-50 transition-colors cursor-pointer group",
                                                      index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                                                )}
                                          >
                                                <td className="px-4 py-2 font-medium text-warmgray-900">{employee.fullName}</td>
                                                <td className="px-4 py-2 text-warmgray-600">{employee.position}</td>
                                                <td className="px-4 py-2 text-warmgray-600">{employee.email}</td>
                                                <td className="px-4 py-2 text-warmgray-600">{employee.mobilePhone}</td>
                                                <td className="px-4 py-2 text-warmgray-600">{employee.branch}</td>
                                                <td className="px-4 py-2 text-warmgray-600">
                                                      <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-xs font-medium",
                                                            employee.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                      )}>
                                                            {employee.isActive ? 'Aktif' : 'Non Aktif'}
                                                      </span>
                                                </td>
                                          </tr>
                                    ))}
                                    {employees.length === 0 && !loading && (
                                          <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-warmgray-500">
                                                      <p className="text-lg font-medium">Belum ada data karyawan</p>
                                                      <p className="text-sm">Silakan tambahkan data karyawan baru.</p>
                                                </td>
                                          </tr>
                                    )}
                              </tbody>
                        </table>
                  </div>
            </div>
      );
}
