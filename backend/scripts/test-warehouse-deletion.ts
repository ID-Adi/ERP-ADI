import { PrismaClient } from '@prisma/client';
import { WarehouseService } from '../src/domain/masters/warehouse.service';

const prisma = new PrismaClient();
const warehouseService = new WarehouseService();

async function runTest() {
    console.log('🚀 Memulai Simulasi Testing Penghapusan Gudang...');
    
    let companyId = '';
    let itemForTest = null;

    try {
        // 1. Setup Company
        const company = await prisma.company.findFirst();
        if (!company) {
            console.error('❌ Tidak ada company ditemukan. Harap seed database terlebih dahulu.');
            return;
        }
        companyId = company.id;
        console.log(`✅ Menggunakan Company ID: ${companyId}`);

        // 2. Setup Dummy Item (untuk dependency stok)
        itemForTest = await prisma.item.findFirst({ where: { companyId } });
        if (!itemForTest) {
            console.log('⚠️ Tidak ada item ditemukan, membuat dummy item sementara...');
            const newItem = await prisma.item.create({
                data: {
                    companyId,
                    code: 'TEST-ITEM-' + Date.now(),
                    name: 'Test Item for Warehouse Deletion',
                    isStockItem: true
                }
            });
            itemForTest = newItem;
            console.log(`✅ Dummy Item dibuat: ${newItem.code}`);
        } else {
             console.log(`✅ Menggunakan Item yang ada: ${itemForTest.code}`);
        }

        // --- TEST CASE 1: Hapus Gudang Kosong (Harus Berhasil) ---
        console.log('\n--- TEST CASE 1: Hapus Gudang Kosong ---');
        const emptyWarehouse = await warehouseService.createWarehouse(companyId, {
            name: 'Gudang Test Kosong',
            code: 'WH-EMPTY-' + Date.now(),
            isActive: true
        });
        console.log(`✅ Gudang Kosong dibuat: ${emptyWarehouse.name} (${emptyWarehouse.id})`);

        try {
            await warehouseService.deleteWarehouse(emptyWarehouse.id);
            console.log('✅ SUKSES: Gudang kosong berhasil dihapus sesuai ekspektasi.');
        } catch (error) {
            console.error('❌ GAGAL: Gudang kosong tidak bisa dihapus!', error);
        }


        // --- TEST CASE 2: Hapus Gudang Berisi Stok (Harus Gagal) ---
        console.log('\n--- TEST CASE 2: Hapus Gudang dengan Dependensi (Stok) ---');
        const stockWarehouse = await warehouseService.createWarehouse(companyId, {
            name: 'Gudang Test Stok',
            code: 'WH-STOCK-' + Date.now(),
            isActive: true
        });
        console.log(`✅ Gudang Stok dibuat: ${stockWarehouse.name} (${stockWarehouse.id})`);

        // Tambah Stok Dummy
        await prisma.itemStock.create({
            data: {
                itemId: itemForTest.id,
                warehouseId: stockWarehouse.id,
                currentStock: 10,
                availableStock: 10
            }
        });
        console.log('✅ Dummy Stok ditambahkan ke gudang.');

        // Coba Hapus
        try {
            await warehouseService.deleteWarehouse(stockWarehouse.id);
            console.error('❌ GAGAL: Gudang berhasil dihapus padahal ada stok! (Bug)');
        } catch (error: any) {
            if (error.message.includes('masih memiliki stok atau riwayat transaksi')) {
                console.log(`✅ SUKSES: Penghapusan ditolak sesuai ekspektasi.\n   Pesan Error: "${error.message}"`);
            } else {
                console.error('❌ GAGAL: Error terjadi tapi pesannya salah:', error.message);
            }
        }

        // Cleanup Warehouse Test 2 (Manual Delete via Prisma untuk bypass check)
        await prisma.itemStock.deleteMany({ where: { warehouseId: stockWarehouse.id } });
        await prisma.warehouse.delete({ where: { id: stockWarehouse.id } });
        console.log('🧹 Cleanup: Gudang test stok dan stoknya telah dibersihkan.');

    } catch (e) {
        console.error('💥 Terjadi kesalahan tak terduga:', e);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
