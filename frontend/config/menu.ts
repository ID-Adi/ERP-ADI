import {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    ShoppingCart,
    Wallet,
    BarChart3,
    Settings,
    Building2,
    Banknote,
    GitFork,
    Percent,
    CreditCard,
    Truck,
    Ship,
    Repeat,
    CalendarCheck2,
    Contact,
    Star,
    FileCheck,
    Calendar,
    History,
    FileInput,
    ArrowRightLeft,
    Sliders,
    Hammer,
    PlusCircle,
    CheckCircle,
    ClipboardList,
    Warehouse,
    Scale,
    Tags,
    Award,
    ClipboardCheck,
    AlertTriangle,
} from 'lucide-react';

export interface MenuItem {
    title: string;
    href?: string;
    icon: React.ElementType;
    children?: MenuItem[];
    // Helper to check if any child is active
    isChildActive?: (pathname: string) => boolean;
}

export const isMenuItemActive = (item: MenuItem, pathname: string): boolean => {
    if (item.href && item.href === pathname) return true;
    if (item.children) {
        return item.children.some(child => isMenuItemActive(child, pathname));
    }
    return false;
};

export const menuItems: MenuItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Perusahaan',
        href: '/dashboard/company',
        icon: Building2,
    },
    {
        title: 'Buku Besar',
        icon: Wallet,
        children: [
            { title: 'Akun Perkiraan', href: '/dashboard/masters/akun-perkiraan', icon: FileText },
            { title: 'Pencatatan Beban', href: '/dashboard/general-ledger/expense', icon: FileText },
            { title: 'Pencatatan Gaji', href: '/dashboard/general-ledger/salary', icon: FileText },
            { title: 'Jurnal Umum', href: '/dashboard/general-ledger/journal', icon: FileText },
            { title: 'Histori Akun', href: '/dashboard/general-ledger/history', icon: History },
            { title: 'Log Aktivitas Jurnal', href: '/dashboard/general-ledger/log', icon: FileText },
            { title: 'Anggaran', href: '/dashboard/general-ledger/budget', icon: FileText },
        ],
    },
    {
        title: 'Penjualan',
        icon: ShoppingCart,
        children: [
            { title: 'Penawaran', href: '/dashboard/sales/penawaran', icon: FileText },
            { title: 'Pesanan Penjualan', href: '/dashboard/sales/pesanan', icon: FileText },
            { title: 'Pengiriman', href: '/dashboard/sales/pengiriman', icon: Package },
            { title: 'Uang Muka', href: '/dashboard/sales/uang-muka', icon: Wallet },
            { title: 'Faktur', href: '/dashboard/sales/faktur', icon: FileText },
            { title: 'Penerimaan', href: '/dashboard/sales/penerimaan', icon: Wallet },
            { title: 'Retur', href: '/dashboard/sales/retur', icon: Package },
            { title: 'Pelanggan', href: '/dashboard/sales/pelanggan', icon: Users },
        ],
    },
    {
        title: 'Pembelian',
        icon: ShoppingCart,
        children: [
            { title: 'Pesanan Pembelian', href: '/dashboard/purchases/orders', icon: FileText },
            { title: 'Tagihan', href: '/dashboard/purchases/bills', icon: FileText },
        ],
    },
    {
        title: 'Persediaan',
        icon: Package,
        children: [
            { title: 'Permintaan Barang', href: '/dashboard/inventory/item-requests', icon: FileInput },
            { title: 'Pemindahan Barang', href: '/dashboard/inventory/item-transfers', icon: ArrowRightLeft },
            { title: 'Penyesuaian Persediaan', href: '/dashboard/inventory/adjustments', icon: Sliders },
            { title: 'Perintah Stok Opname', href: '/dashboard/inventory/stock-opname-orders', icon: ClipboardList },
            { title: 'Hasil Stok Opname', href: '/dashboard/inventory/stock-opname-results', icon: FileCheck },
            { title: 'Barang & Jasa', href: '/dashboard/inventory/items', icon: Package },
            { title: 'Gudang', href: '/dashboard/inventory/warehouses', icon: Warehouse },
            { title: 'Satuan Barang', href: '/dashboard/inventory/units', icon: Scale },
            { title: 'Kategori Barang', href: '/dashboard/inventory/categories', icon: Tags },
            { title: 'Merek Barang', href: '/dashboard/inventory/brands', icon: Award },
            { title: 'Barang per Gudang', href: '/dashboard/inventory/items-per-warehouse', icon: Building2 },
            { title: 'Barang Stok Minimum', href: '/dashboard/inventory/minimum-stock', icon: AlertTriangle },
        ],
    },
    {
        title: 'Laporan',
        icon: BarChart3,
        children: [
            { title: 'Neraca Saldo', href: '/dashboard/reports/trial-balance', icon: BarChart3 },
            { title: 'Neraca', href: '/dashboard/reports/balance-sheet', icon: BarChart3 },
            { title: 'Laba Rugi', href: '/dashboard/reports/income-statement', icon: BarChart3 },
        ],
    },
    {
        title: 'Pengaturan',
        href: '/dashboard/settings',
        icon: Settings,
    },
];
