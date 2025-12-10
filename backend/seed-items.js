const { PrismaClient, PriceType } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();
const FILE_PATH = path.join(__dirname, '../Docs/Barang & jasa.xlsx');

async function main() {
    console.log('🌱 Starting item seed from Excel...');

    // 1. Get Company
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No company found!");
    const companyId = company.id;

    // 2. Read Excel
    const workbook = xlsx.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet); // Objects with keys as headers

    console.log(`Found ${rows.length} items to process.`);

    // 3. Process Warehouses
    const warehouseNames = new Set();
    rows.forEach(row => {
        if (row['Gudang']) warehouseNames.add(row['Gudang']);
    });

    const warehouseMap = new Map(); // Name -> ID

    for (const name of warehouseNames) {
        // Create simplified code from name (e.g. "GUDANG PALANGKARAYA" -> "WH-PLK" or just uppercase no spaces)
        const code = name.toUpperCase().replace(/\s+/g, '-').slice(0, 10);

        const wh = await prisma.warehouse.upsert({
            where: { companyId_code: { companyId, code } },
            update: {},
            create: {
                companyId,
                code,
                name: name,
                isActive: true
            }
        });
        warehouseMap.set(name, wh.id);
        console.log(`Processed Warehouse: ${name} -> ${wh.id}`);
    }

    // 4. Process Items
    let processedCount = 0;

    // Batch processing to avoid overwhelming DB? 
    // For < 1000 items, sequential or small chunks is fine. 
    // Prisma upsert is safe.

    for (const row of rows) {
        const code = String(row['Kode']).trim();
        const name = String(row['Nama Barang']).trim();
        const uom = String(row['Unit']).trim().toUpperCase();
        const qty = Number(row['Kuantitas']) || 0;
        const price = Number(row['Harga jual']) || 0;
        const warehouseName = row['Gudang'];

        if (!code || !name) continue;

        // Upsert Item
        const item = await prisma.item.upsert({
            where: { companyId_code: { companyId, code } },
            update: {
                name,
                uom,
            },
            create: {
                companyId,
                code,
                name,
                uom,
                isStockItem: true,
                isActive: true
            }
        });

        // Upsert Price (SELL)
        // Since no unique constraint on itemId + priceType alone (it has logic), we findFirst then update or create
        const pricing = await prisma.itemPricing.findFirst({
            where: { itemId: item.id, priceType: 'SELL' }
        });

        if (pricing) {
            await prisma.itemPricing.update({
                where: { id: pricing.id },
                data: { price }
            });
        } else {
            await prisma.itemPricing.create({
                data: {
                    itemId: item.id,
                    priceType: 'SELL',
                    price,
                    currency: 'IDR'
                }
            });
        }

        // Upsert Stock
        const warehouseId = warehouseMap.get(warehouseName);
        if (warehouseId) {
            await prisma.itemStock.upsert({
                where: {
                    itemId_warehouseId: {
                        itemId: item.id,
                        warehouseId
                    }
                },
                update: {
                    currentStock: qty,
                    availableStock: qty // Simplified: assume all available
                },
                create: {
                    itemId: item.id,
                    warehouseId,
                    currentStock: qty,
                    availableStock: qty
                }
            });
        }

        processedCount++;
        if (processedCount % 50 === 0) console.log(`Processed ${processedCount} items...`);
    }

    console.log(`✅ Successfully processed ${processedCount} items.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
