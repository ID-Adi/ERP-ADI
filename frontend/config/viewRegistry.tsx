import React from 'react';
import FakturView from '@/components/views/sales/FakturView';

import PelangganView from '@/components/views/sales/PelangganView';
import PenawaranView from '@/components/views/sales/PenawaranView';
import PesananView from '@/components/views/sales/PesananView';
import PengirimanView from '@/components/views/sales/PengirimanView';
import PenerimaanView from '@/components/views/sales/PenerimaanView';
import ReturView from '@/components/views/sales/ReturView';
import UangMukaView from '@/components/views/sales/UangMukaView';

import ItemsView from '@/components/views/inventory/ItemsView';
import WarehousesView from '@/components/views/inventory/WarehousesView';
import CategoriesView from '@/components/views/inventory/CategoriesView';
import UnitsView from '@/components/views/inventory/UnitsView';

// Helper to lazy load views if needed, but for now we import directly for keep-alive simplicity
// In a larger app, we might need a more sophisticated dynamic import strategy that still allows keep-alive.

// Component Type
type ViewComponent = React.ComponentType<any>;

// Map URL paths to View Component
export const viewRegistry: Record<string, ViewComponent> = {
    '/dashboard/sales/faktur': FakturView,
    '/dashboard/sales/pelanggan': PelangganView,
    '/dashboard/sales/penawaran': PenawaranView,
    '/dashboard/sales/pesanan': PesananView,
    '/dashboard/sales/pengiriman': PengirimanView,
    '/dashboard/sales/penerimaan': PenerimaanView,
    '/dashboard/sales/retur': ReturView,
    '/dashboard/sales/uang-muka': UangMukaView,

    // Inventory
    '/dashboard/inventory/items': ItemsView,
    '/dashboard/inventory/warehouses': WarehousesView,
    '/dashboard/inventory/categories': CategoriesView,
    '/dashboard/inventory/units': UnitsView,
    // Add other views here as we refactor
};

// Default View Component for unregistered routes (Fallback to old routing / children?)
// Actually, we will render children if no view found, or a "Not Found" view.
