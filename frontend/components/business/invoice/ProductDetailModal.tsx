'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Trash2, Edit2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import SearchableSelect from '@/components/ui/SearchableSelect';
import api from '@/lib/api';
import { showError } from '@/lib/swal';

interface LineItem {
    id: string;
    itemCode: string;
    description: string;
    notes?: string; // User notes
    quantity: number;
    unit: string;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    taxPercent: number;
    lineAmount: number;
    taxAmount: number;
    totalAmount: number;
    warehouseId?: string;
    warehouseName?: string;
    salespersonId?: string;
    salespersonName?: string;
    itemId?: string;
}

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: LineItem) => void;
    onDelete?: (id: string) => void;
    initialData?: LineItem;
    mode: 'add' | 'edit';
}

export default function ProductDetailModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    mode
}: ProductDetailModalProps) {
    const [formData, setFormData] = useState<LineItem>({
        id: '',
        itemCode: '',
        description: '',
        notes: '',
        quantity: 1,
        unit: 'PCS',
        unitPrice: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 11,
        lineAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        warehouseId: '',
        salespersonId: '',
    });

    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [salespersons, setSalespersons] = useState<any[]>([]);
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    const [units, setUnits] = useState<string[]>([]);
    // const units = ['PCS', 'BOX', 'KD', 'UNT', 'SET', 'LSN', 'DOS'];

    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return; // Only fetch when open

            try {
                // Pass itemId if available to fetch specific stock
                const itemId = formData.itemId || initialData?.itemId;

                const [whRes, spRes, uRes] = await Promise.all([
                    api.get('/warehouses', { params: { itemId } }),
                    api.get('/salespersons'),
                    api.get('/units') // Fetch units
                ]);
                const whData = whRes.data.data || [];
                setWarehouses(whData);
                setSalespersons(spRes.data.data || []);
                // Assume uRes.data.data is array of objects { name: string, ... }
                // We map to string array for the dropdown as per current UI
                const unitData = uRes.data.data || [];
                setUnits(unitData.map((u: any) => u.name));

                // Set default warehouse if available and not set
                if (whData.length > 0 && !formData.warehouseId) {
                    setFormData(prev => ({
                        ...prev,
                        warehouseId: whData[0].id,
                        warehouseName: whData[0].name
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch master data:', error);
            }
        };
        fetchData();
    }, [isOpen, formData.itemId]); // Refetch when modal opens or item changes

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Safely handle potentially string numbers in initialData too
                const safePrice = typeof initialData.unitPrice === 'string'
                    ? parseFloat((initialData.unitPrice as string).replace(/\./g, '').replace(',', '.'))
                    : (initialData.unitPrice || 0);

                setFormData({
                    ...initialData,
                    unitPrice: isNaN(safePrice) ? 0 : safePrice,
                    quantity: initialData.quantity || 1
                });
            } else {
                // Reset for new item
                setFormData({
                    id: Date.now().toString(),
                    itemCode: '',
                    description: '',
                    quantity: 1,
                    unit: 'PCS',
                    unitPrice: 0,
                    discountPercent: 0,
                    discountAmount: 0,
                    taxPercent: 11,
                    lineAmount: 0,
                    taxAmount: 0,
                    totalAmount: 0,
                    warehouseId: '',
                    salespersonId: '',
                });
            }
        }
    }, [isOpen, initialData]);

    // Calculations
    useEffect(() => {
        const quantity = formData.quantity || 0;
        const price = formData.unitPrice || 0;
        const subtotal = quantity * price;

        // Discount Calculation (Priority: Amount > Percent implicitly, but here we sync them)
        // For simplicity, let's say if user edits amount, we calc percent, and vice versa.
        // But to avoid circular loops, we'll just derive totals. 
        // Let's assume the input is the source of truth.

        // Simple logic: Total = (Qty * Price) - DiscountAmount
        const discountAmt = formData.discountAmount;
        const taxable = subtotal - discountAmt;
        // const tax = (taxable * formData.taxPercent) / 100;

        // *Correction*: Ref image shows direct Total Price field. 
        // Usually Total = Qty * Price - Disc + Tax. 
        // Let's stick to simple Subtotal - Disc for "Total Harga" in the modal usually means Line Total before global tax, 
        // OR it includes tax. Ref image 5 just shows "Total Harga". 
        // Let's assume it's (Qty * Price) - Discount for now, tax is usually calc'd globally or hidden fields.

        const calculatedTotal = subtotal - discountAmt;

        setFormData(prev => {
            if (prev.totalAmount !== calculatedTotal) {
                return {
                    ...prev,
                    lineAmount: subtotal,
                    totalAmount: calculatedTotal
                }
            }
            return prev;
        });

    }, [formData.quantity, formData.unitPrice, formData.discountAmount]);


    const handleChange = (field: keyof LineItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDiscountPercentChange = (percent: number) => {
        const subtotal = formData.quantity * formData.unitPrice;
        const amount = (subtotal * percent) / 100;
        setFormData(prev => ({ ...prev, discountPercent: percent, discountAmount: amount }));
    };

    const handleDiscountAmountChange = (amount: number) => {
        const subtotal = formData.quantity * formData.unitPrice;
        const percent = subtotal > 0 ? (amount / subtotal) * 100 : 0;
        setFormData(prev => ({ ...prev, discountAmount: amount, discountPercent: percent }));
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-primary-700 text-white rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <Edit2 className="h-4 w-4" />
                        <span className="font-semibold text-base">{mode === 'add' ? 'Tambah Barang' : 'Rincian Barang'}</span>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                    {/* Row 1: Code */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">Kode #</label>
                        <div className="col-span-9 text-primary-600 font-medium text-sm">
                            {formData.itemCode || 'Auto-Generated'}
                        </div>
                    </div>

                    {/* Row 2: Name */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">Nama Barang</label>
                        <div className="col-span-9 relative">
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full pl-3 pr-8 py-1.5 border border-warmgray-300 rounded focus:outline-none focus:ring-0 focus:border-primary-500 text-sm"
                                placeholder="Cari atau ketik nama barang..."
                            />
                            <X className="absolute right-2 top-2 h-4 w-4 text-warmgray-400 cursor-pointer hover:text-warmgray-600" onClick={() => handleChange('description', '')} />
                        </div>
                    </div>

                    {/* Row 2.5: Notes */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">Catatan</label>
                        <div className="col-span-9">
                            <input
                                type="text"
                                value={formData.notes || ''}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                className="w-full px-3 py-1.5 border border-warmgray-300 rounded focus:outline-none focus:ring-0 focus:border-primary-500 text-sm"
                                placeholder="Tambahkan catatan..."
                            />
                        </div>
                    </div>

                    {/* Row 3: Quantity */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">Kuantitas</label>
                        <div className="col-span-9 flex flex-col gap-1">
                            <div className="flex gap-4">
                                <div className="w-[120px] relative">
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => handleChange('quantity', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                        onFocus={(e) => { if (formData.quantity === 0) handleChange('quantity', ''); e.target.select(); }}
                                        onBlur={(e) => { if (e.target.value === '' || isNaN(parseFloat(e.target.value))) handleChange('quantity', 1); }}
                                        className={cn(
                                            "w-full pl-3 pr-8 py-1.5 border rounded focus:outline-none focus:ring-0 text-sm text-right font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                            formData.warehouseId && warehouses.find(w => w.id === formData.warehouseId)?.stock !== undefined && formData.quantity > (warehouses.find(w => w.id === formData.warehouseId)?.stock || 0)
                                                ? "border-red-500 text-red-600 focus:border-red-500 bg-red-50"
                                                : "border-warmgray-300 focus:border-primary-500"
                                        )}
                                    />
                                    <Calculator className="absolute right-2 top-2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                                </div>

                                {/* Unit Dropdown */}
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-sm font-medium text-warmgray-700">Unit</span>
                                    <div className="relative flex-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                                            className="w-full flex items-center justify-between px-3 py-1.5 border border-warmgray-300 rounded bg-white hover:bg-warmgray-50 focus:outline-none focus:ring-0 focus:border-primary-500 text-sm text-left"
                                        >
                                            <span className="font-medium text-warmgray-900">{formData.unit}</span>
                                            <Search className="h-4 w-4 text-warmgray-400" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showUnitDropdown && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowUnitDropdown(false)}
                                                />
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-warmgray-200 rounded shadow-lg max-h-40 overflow-y-auto z-20">
                                                    {units.map((u) => (
                                                        <button
                                                            key={u}
                                                            type="button"
                                                            onClick={() => {
                                                                handleChange('unit', u);
                                                                setShowUnitDropdown(false);
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2 text-sm hover:bg-warmgray-50 transition-colors",
                                                                formData.unit === u ? "bg-primary-50 text-primary-700 font-medium" : "text-warmgray-700"
                                                            )}
                                                        >
                                                            {u}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {formData.warehouseId && warehouses.find(w => w.id === formData.warehouseId)?.stock !== undefined && formData.quantity > (warehouses.find(w => w.id === formData.warehouseId)?.stock || 0) && (
                                <span className="text-xs text-red-600 font-medium animate-pulse">
                                    Stok tidak mencukupi! Tersedia: {warehouses.find(w => w.id === formData.warehouseId)?.stock || 0} {formData.unit}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Row 4: Price */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">@Harga</label>
                        <div className="col-span-9 flex relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-warmgray-500 text-xs">Rp</span>
                            </div>
                            <input
                                type="number"
                                value={formData.unitPrice}
                                onChange={(e) => handleChange('unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                onFocus={(e) => { if (formData.unitPrice === 0) handleChange('unitPrice', ''); e.target.select(); }}
                                onBlur={(e) => { if (e.target.value === '' || isNaN(parseFloat(e.target.value))) handleChange('unitPrice', 0); }}
                                className="w-full pl-9 pr-8 py-1.5 border border-warmgray-300 rounded focus:outline-none focus:ring-0 focus:border-primary-500 text-sm text-right font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Calculator className="absolute right-2 top-2 h-4 w-4 text-warmgray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Row 5: Discount */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">Diskon</label>
                        <div className="col-span-9 flex gap-2">
                            <div className="relative w-1/3">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-warmgray-500 text-xs">%</span>
                                </div>
                                <input
                                    type="number"
                                    value={formData.discountPercent}
                                    onChange={(e) => handleDiscountPercentChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    onFocus={(e) => { if (formData.discountPercent === 0) setFormData(prev => ({ ...prev, discountPercent: '' as any })); e.target.select(); }}
                                    onBlur={(e) => { if (e.target.value === '' || isNaN(parseFloat(e.target.value))) setFormData(prev => ({ ...prev, discountPercent: 0 })); }}
                                    className="w-full pl-7 pr-2 py-1.5 border border-warmgray-300 rounded focus:outline-none focus:ring-0 focus:border-primary-500 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-warmgray-500 text-xs">Rp</span>
                                </div>
                                <input
                                    type="number"
                                    value={formData.discountAmount}
                                    onChange={(e) => handleDiscountAmountChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    onFocus={(e) => { if (formData.discountAmount === 0) setFormData(prev => ({ ...prev, discountAmount: '' as any })); e.target.select(); }}
                                    onBlur={(e) => { if (e.target.value === '' || isNaN(parseFloat(e.target.value))) setFormData(prev => ({ ...prev, discountAmount: 0 })); }}
                                    className="w-full pl-9 pr-6 py-1.5 border border-warmgray-300 rounded focus:outline-none focus:ring-0 focus:border-primary-500 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <Calculator className="absolute right-2 top-2 h-4 w-4 text-warmgray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Row 6: Total Price */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">Total Harga</label>
                        <div className="col-span-9">
                            <div className="w-full py-1.5 px-3 bg-warmgray-50 border border-warmgray-200 rounded text-right font-bold text-warmgray-900 text-sm">
                                {formatCurrency(formData.totalAmount)}
                            </div>
                        </div>
                    </div>

                    <hr className="border-warmgray-200" />

                    {/* Row 7: Warehouse */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">Gudang <span className="text-red-500">*</span></label>
                        <div className="col-span-9 relative">
                            <SearchableSelect
                                options={warehouses.map(wh => ({
                                    value: wh.id,
                                    label: wh.name,
                                    description: wh.stock !== undefined ? `Stok: ${wh.stock} ${formData.unit || 'PCS'}` : wh.code
                                }))}
                                value={formData.warehouseId}
                                onChange={(val) => {
                                    const selected = warehouses.find(w => w.id === val);
                                    setFormData(prev => ({
                                        ...prev,
                                        warehouseId: val,
                                        warehouseName: selected?.name
                                    }));
                                }}
                                placeholder="Pilih Gudang..."
                            />
                        </div>
                    </div>

                    {/* Row 8: Salesperson */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                        <label className="col-span-3 text-sm font-medium text-warmgray-700">Penjual</label>
                        <div className="col-span-9 relative">
                            <SearchableSelect
                                options={salespersons.map(sp => ({ value: sp.id, label: sp.name, description: sp.code }))}
                                value={formData.salespersonId}
                                onChange={(val) => {
                                    const selected = salespersons.find(s => s.id === val);
                                    setFormData(prev => ({
                                        ...prev,
                                        salespersonId: val,
                                        salespersonName: selected?.name
                                    }));
                                }}
                                placeholder="Pilih Penjual..."
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-warmgray-200 flex justify-between items-center bg-warmgray-50 rounded-b-lg">
                    {mode === 'edit' && onDelete ? (
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-9" onClick={() => onDelete(formData.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </Button>
                    ) : <div />}

                    <Button variant="primary" className="bg-primary-700 hover:bg-primary-800 text-white min-w-[100px] h-9" onClick={async () => {
                        if (!formData.warehouseId) {
                            await showError("Data Tidak Lengkap", "Mohon pilih gudang terlebih dahulu");
                            return;
                        }
                        onSave(formData);
                    }}>
                        Lanjut
                    </Button>
                </div>
            </div>
        </div >,
        document.body
    );
}
