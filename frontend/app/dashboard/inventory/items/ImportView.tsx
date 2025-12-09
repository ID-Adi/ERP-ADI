import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import Card from '@/components/ui/Card';
import api from '@/lib/api';

interface ImportViewProps {
    onCancel: () => void;
}

export default function ImportView({ onCancel }: ImportViewProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        setError(null);
        setSuccess(false);
        // Check extension
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            setError('Hanya file Excel (.xlsx, .xls) yang diperbolehkan.');
            return;
        }
        setFile(file);
    };

    const handleImport = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            if (jsonData.length === 0) {
                throw new Error('File kosong atau format salah');
            }

            // Map keys
            const mappedData = jsonData.map((row: any) => ({
                name: row['Nama Barang'],
                code: row['Kode Barang'],
                kategori: row['Kategori'],
                type: row['Jenis'],
                unit: row['Satuan'],
                brand: row['Merek'],
                purchasePrice: row['Harga Beli'],
                sellPrice: row['Harga Jual'],
                minStock: row['Stok Minimum'],
                description: row['Deskripsi']
            }));

            // Send to API
            const res = await api.post('/items/batch', mappedData);

            if (res.data.stats.failed > 0) {
                // If some failed, show partial error
                setError(`Import selesai dengan catatan: ${res.data.stats.success} berhasil, ${res.data.stats.failed} gagal. Cek console untuk detail.`);
                console.warn('Import Errors:', res.data.stats.errors);
            } else {
                setSuccess(true);
                setFile(null);
            }

        } catch (err: any) {
            console.error('Import failed:', err);
            setError(err.response?.data?.error || err.message || 'Gagal mengimport file.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'Nama Barang',
            'Kode Barang',
            'Kategori',
            'Jenis', // Persediaan / Jasa
            'Satuan',
            'Merek',
            'Harga Beli',
            'Harga Jual',
            'Stok Awal',
            'Stok Minimum',
            'Deskripsi'
        ];

        const exampleData = [
            ['Contoh Barang A', 'BRG-001', 'Umum', 'Persediaan', 'PCS', 'Merek A', 50000, 75000, 10, 5, 'Deskripsi barang A'],
            ['Contoh Jasa B', 'SVC-001', 'Jasa', 'Jasa', 'JAM', '', 0, 100000, 0, 0, 'Jasa pelayanan B']
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

        // Auto-width for columns
        const wscols = headers.map(h => ({ wch: h.length + 5 }));
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Barang");

        XLSX.writeFile(wb, "template-barang-erp-adi.xlsx");
    };

    return (
        <div className="flex flex-col h-full bg-surface-50 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-surface-200 shadow-sm flex-none">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                        <Upload className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-warmgray-900">Import Barang</h1>
                        <p className="text-sm text-warmgray-500">Upload data barang masal menggunakan Excel</p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 text-warmgray-400 hover:text-warmgray-600 hover:bg-surface-100 rounded-full transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-auto flex items-center justify-center">
                <Card className="w-full max-w-2xl">
                    <div className="p-6 space-y-6">
                        {/* Status Messages */}
                        {error && (
                            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-3 text-danger-700">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-medium">Terjadi Kesalahan</h3>
                                    <p className="text-sm mt-1 opacity-90">{error}</p>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-700">
                                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-medium">Berhasil Diimport!</h3>
                                    <p className="text-sm mt-1 opacity-90">Data barang berhasil dimasukkan ke sistem.</p>
                                </div>
                            </div>
                        )}

                        {/* Upload Zone */}
                        <div
                            className={cn(
                                "relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer group",
                                dragActive
                                    ? "border-primary-500 bg-primary-50 scale-[1.02]"
                                    : "border-surface-300 hover:border-primary-400 hover:bg-surface-50",
                                file && "border-primary-500 bg-primary-50/30"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={handleChange}
                            />

                            <div className="flex flex-col items-center gap-4">
                                <div className={cn(
                                    "h-16 w-16 rounded-full flex items-center justify-center transition-colors shadow-sm",
                                    file ? "bg-emerald-100 text-emerald-600" : "bg-primary-100 text-primary-600 group-hover:scale-110 duration-200"
                                )}>
                                    {file ? <FileSpreadsheet className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                                </div>

                                <div className="space-y-1">
                                    {file ? (
                                        <>
                                            <p className="text-lg font-medium text-warmgray-900 break-all">{file.name}</p>
                                            <p className="text-sm text-warmgray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg font-medium text-warmgray-900">
                                                Klik untuk upload atau drag & drop
                                            </p>
                                            <p className="text-sm text-warmgray-500">
                                                File Excel (.xlsx, .xls) maksimal 10MB
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={handleDownloadTemplate}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                            >
                                Download Template Excel
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleImport();
                                }}
                                disabled={!file || uploading}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-md transition-all active:scale-95",
                                    !file || uploading
                                        ? "bg-warmgray-300 cursor-not-allowed"
                                        : "bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5"
                                )}
                            >
                                {uploading ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Proses...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        <span>Import Sekarang</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
