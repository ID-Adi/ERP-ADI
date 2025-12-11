import { Router, Request, Response } from 'express';
import { PrismaClient, PriceType } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/items/list - Lightweight endpoint for list views (no heavy joins)
router.get('/list', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const status = req.query.status as string;
        const category = req.query.category as string;
        const type = req.query.type as string;
        const brand = req.query.brand as string;


        const skip = (page - 1) * limit;

        const where: any = {};

        if (status && status !== 'Semua') {
            if (status === 'Non Aktif') {
                where.isActive = false;
            } else if (status === 'Aktif') {
                where.isActive = true;
            }
        }

        if (category && category !== 'Semua') {
            where.categoryId = category;
        }

        if (brand && brand !== 'Semua') {
            where.brand = brand;
        }

        if (type && type !== 'Semua') {
            if (type === 'Persediaan') where.isStockItem = true;
            else if (type === 'Jasa') where.isStockItem = false;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Run count and fetch in parallel for better performance
        const [total, items] = await Promise.all([
            prisma.item.count({ where }),
            prisma.item.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    uom: true,
                    isStockItem: true,
                    isActive: true,
                    brand: true,
                    categoryId: true,
                    category: {
                        select: { name: true }
                    },
                    // Minimal pricing for list display
                    pricing: {
                        where: { isActive: true, priceType: 'SELL' },
                        select: { price: true },
                        take: 1
                    },
                    // Aggregate stock data
                    stocks: {
                        select: { currentStock: true, availableStock: true }
                    }
                }
            })
        ]);

        // Lightweight mapping
        const listItems = items.map(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            unit: item.uom,
            type: item.isStockItem ? 'Persediaan' : 'Jasa',
            isActive: item.isActive,
            brand: item.brand,
            categoryName: item.category?.name || '-',
            sellPrice: item.pricing[0] ? Number(item.pricing[0].price) : 0,
            warehouseQty: item.stocks.reduce((sum, s) => sum + Number(s.currentStock), 0),
            sellableStock: item.stocks.reduce((sum, s) => sum + Number(s.availableStock), 0)
        }));

        res.json({
            data: listItems,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching items list:', error);
        res.status(500).json({ error: 'Failed to fetch items list' });
    }
});

// GET /api/items
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = (req.query.search as string)?.trim();
        const status = req.query.status as string;
        const category = req.query.category as string;
        const type = req.query.type as string;
        const brand = req.query.brand as string;

        const skip = (page - 1) * limit;

        const where: any = {};

        if (status && status !== 'Semua') {
            if (status === 'Non Aktif') {
                where.isActive = false;
            } else if (status === 'Aktif') {
                where.isActive = true;
            }
        }

        if (category && category !== 'Semua') {
            where.categoryId = category;
        }

        if (brand && brand !== 'Semua') {
            where.brand = brand;
        }

        // ... (type filter logic is fine)

        if (search) {
            console.log(`DEBUG SEARCH: "${search}"`);
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
            console.log(`DEBUG SEARCH WHERE:`, JSON.stringify(where, null, 2));
        }

        if (type && type !== 'Semua') {
            if (type === 'Persediaan') where.isStockItem = true;
            else if (type === 'Jasa') where.isStockItem = false;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Run count and fetch in parallel for better performance
        const [total, items] = await Promise.all([
            prisma.item.count({ where }),
            prisma.item.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    company: { select: { name: true } },
                    category: { select: { id: true, name: true, code: true } },
                    pricing: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            priceType: true,
                            price: true,
                            defaultDiscount: true,
                            minimumQuantity: true
                        }
                    },
                    stocks: {
                        select: {
                            id: true,
                            warehouseId: true,
                            currentStock: true,
                            availableStock: true,
                            minStock: true,
                            warehouse: { select: { name: true, code: true } }
                        }
                    },
                    suppliers: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            supplierId: true,
                            isPrimary: true,
                            purchasePrice: true,
                            supplier: { select: { name: true, code: true } }
                        }
                    },
                    taxes: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            taxCode: true,
                            taxName: true,
                            taxRate: true
                        }
                    }
                }
            })
        ]);

        // Map to frontend structure
        const enrichedItems = items.map(item => {
            // Get sell and purchase prices from pricing table
            const sellPricing = item.pricing.find(p => p.priceType === 'SELL');
            const purchasePricing = item.pricing.find(p => p.priceType === 'PURCHASE');

            // Calculate total stock across all warehouses
            const totalStock = item.stocks.reduce((sum, s) => sum + Number(s.currentStock), 0);
            const totalAvailable = item.stocks.reduce((sum, s) => sum + Number(s.availableStock), 0);
            const minStock = item.stocks.length > 0 ? Number(item.stocks[0].minStock) : 0;

            // Get primary supplier
            const primarySupplier = item.suppliers.find(s => s.isPrimary);

            return {
                id: item.id,
                name: item.name,
                code: item.code,
                type: item.isStockItem ? 'Persediaan' : 'Jasa',
                unit: item.uom,
                warehouseQty: totalStock,
                sellableStock: totalAvailable,
                isActive: item.isActive,
                description: item.description,
                barcode: item.barcode,
                brand: item.brand,
                serialNumberActive: item.serialNumberActive,

                // Category
                categoryId: item.categoryId,
                categoryName: item.category?.name,

                // Pricing (flattened for backward compatibility)
                purchasePrice: purchasePricing ? Number(purchasePricing.price) : 0,
                sellPrice: sellPricing ? Number(sellPricing.price) : 0,
                defaultDiscount: sellPricing ? Number(sellPricing.defaultDiscount) : 0,

                // Stock
                minStock: minStock,

                // Primary Supplier
                primarySupplierId: primarySupplier?.supplierId,
                primarySupplierName: primarySupplier?.supplier.name,

                // Tax
                taxes: item.taxes.map(t => ({
                    code: t.taxCode,
                    name: t.taxName,
                    rate: Number(t.taxRate)
                })),

                // Full relational data for detail view
                pricing: item.pricing,
                stocks: item.stocks,
                suppliers: item.suppliers
            };
        });

        res.json({
            data: enrichedItems,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// GET /api/items/stocks - Get item stocks with warehouse filter
// IMPORTANT: This must be defined BEFORE /:id route
router.get('/stocks', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const warehouseId = req.query.warehouseId as string;
        const itemId = req.query.itemId as string;

        const skip = (page - 1) * limit;

        const where: any = {};

        if (warehouseId && warehouseId !== 'ALL') {
            where.warehouseId = warehouseId;
        }

        if (search) {
            where.item = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ]
            };
        }

        if (itemId) {
            where.itemId = itemId;
        }

        const total = await prisma.itemStock.count({ where });

        const stocks = await prisma.itemStock.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                item: { name: 'asc' }
            },
            include: {
                item: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        uom: true
                    }
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        const flattenStocks = stocks.map(stock => ({
            id: stock.id,
            itemId: stock.item.id,
            itemName: stock.item.name,
            itemCode: stock.item.code,
            uom: stock.item.uom,
            warehouseId: stock.warehouse.id,
            warehouseName: stock.warehouse.name,
            currentStock: Number(stock.currentStock),
            reservedStock: Number(stock.reservedStock),
            availableStock: Number(stock.availableStock),
            minStock: Number(stock.minStock),
            updatedAt: stock.updatedAt
        }));

        res.json({
            data: flattenStocks,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching item stocks:', error);
        res.status(500).json({ error: 'Failed to fetch item stocks' });
    }
});

// GET /api/items/:id - Get single item with all relations
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                company: true,
                category: true,
                pricing: {
                    orderBy: { priceType: 'asc' }
                },
                stocks: {
                    include: {
                        warehouse: true
                    }
                },
                suppliers: {
                    include: {
                        supplier: true
                    },
                    orderBy: { isPrimary: 'desc' }
                },
                taxes: true,
                accounts: true,
                inventoryTransactions: {
                    where: { transactionType: 'INITIAL' },
                    include: {
                        warehouse: true
                    },
                    orderBy: { transactionDate: 'desc' }
                }
            }
        });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Map inventoryTransactions to openingStocks for frontend compatibility
        const openingStocks = item.inventoryTransactions.map(tx => ({
            id: tx.id,
            warehouseId: tx.warehouseId,
            warehouseName: tx.warehouse?.name,
            date: tx.transactionDate.toISOString().split('T')[0],
            quantity: Number(tx.quantity),
            unit: tx.unit,
            costPerUnit: Number(tx.costPerUnit),
            totalCost: Number(tx.totalCost)
        }));

        res.json({
            data: {
                ...item,
                openingStocks
            }
        });

    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// POST /api/items/batch - Batch create items from Excel import
router.post('/batch', async (req: Request, res: Response) => {
    try {
        const items = req.body; // Array of item objects

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Data tidak valid atau kosong' });
        }

        // Get default company
        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            return res.status(500).json({ error: 'No company found' });
        }

        // Get or create default warehouse
        let defaultWarehouse = await prisma.warehouse.findFirst({
            where: { companyId: defaultCompany.id }
        });

        if (!defaultWarehouse) {
            defaultWarehouse = await prisma.warehouse.create({
                data: {
                    companyId: defaultCompany.id,
                    code: 'WH-DEFAULT',
                    name: 'Gudang Utama',
                    isActive: true,
                    updatedAt: new Date()
                }
            });
        }

        const stats = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Process sequentially to avoid race conditions on unique constraints if any
        // For better performance with large datasets, we might want to optimize this,
        // but for < 1000 items, sequential processing is safer and easier to debug.
        // We will wrap EACH item creation in its own transaction (or large transaction?)
        // If we wrap ALL in one transaction, one failure rolls back everything.
        // Usually for imports, "all or nothing" is good, OR "succeed what you can".
        // Let's go with "Succeed what you can" logic so 1 bad row doesn't block 99 good ones.

        for (const itemData of items) {
            try {
                // destruct and defaults
                let {
                    name,
                    code,
                    categoryId,
                    type,
                    unit,
                    description,
                    brand,
                    sellPrice,
                    purchasePrice,
                    minStock,
                    kategori
                } = itemData;

                // Validate basic requirements
                if (!name) {
                    stats.failed++;
                    stats.errors.push(`Row skipped: Nama Barang wajib diisi`);
                    continue;
                }

                // Handle Category Lookup by Name if ID not provided
                let finalCategoryId = categoryId;
                if (!finalCategoryId && kategori) {
                    const cat = await prisma.itemCategory.findFirst({
                        where: { name: { equals: kategori, mode: 'insensitive' }, companyId: defaultCompany.id }
                    });
                    if (cat) finalCategoryId = cat.id;
                }

                // Auto-generate code if missing
                if (!code || code === 'Otomatis' || code === '') {
                    const prefix = 'ITM';
                    const timestamp = Date.now().toString().slice(-6);
                    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                    code = `${prefix}-${timestamp}-${random}`;
                    // Small delay to ensure timestamp uniqueness if tight loop
                    await new Promise(r => setTimeout(r, 2));
                }

                // Check duplicate code
                const existing = await prisma.item.findFirst({
                    where: { companyId: defaultCompany.id, code: code }
                });

                if (existing) {
                    stats.failed++;
                    stats.errors.push(`Item '${name}': Kode '${code}' sudah ada`);
                    continue;
                }

                // Create Item Transaction
                await prisma.$transaction(async (tx) => {
                    // 1. Create item
                    const newItem = await tx.item.create({
                        data: {
                            companyId: defaultCompany.id,
                            name,
                            code,
                            categoryId: finalCategoryId || null,
                            description,
                            uom: unit || 'PCS',
                            brand: brand || null,
                            isStockItem: type !== 'Jasa', // Default Persediaan
                            isActive: true,
                        }
                    });

                    // 2. Pricing
                    const pricingData = [];
                    if (sellPrice) {
                        pricingData.push({
                            id: crypto.randomUUID(),
                            itemId: newItem.id,
                            priceType: 'SELL' as PriceType,
                            price: Number(sellPrice),
                            currency: 'IDR',
                            isActive: true,
                            updatedAt: new Date()
                        });
                    }
                    if (purchasePrice) {
                        pricingData.push({
                            id: crypto.randomUUID(),
                            itemId: newItem.id,
                            priceType: 'PURCHASE' as PriceType,
                            price: Number(purchasePrice),
                            currency: 'IDR',
                            isActive: true,
                            updatedAt: new Date()
                        });
                    }
                    if (pricingData.length > 0) {
                        await tx.itemPricing.createMany({ data: pricingData });
                    }

                    // 3. Stock
                    await tx.itemStock.create({
                        data: {
                            id: crypto.randomUUID(),
                            itemId: newItem.id,
                            warehouseId: defaultWarehouse!.id,
                            minStock: minStock ? Number(minStock) : 0,
                            currentStock: 0,
                            availableStock: 0,
                            updatedAt: new Date()
                        }
                    });
                });

                stats.success++;

            } catch (err: any) {
                console.error('Import Row Error:', err);
                stats.failed++;
                stats.errors.push(`Item '${itemData.name || 'Unknown'}': ${err.message}`);
            }
        }

        res.json({
            message: 'Proses import selesai',
            stats
        });

    } catch (error) {
        console.error('Batch Import Error:', error);
        res.status(500).json({ error: 'Gagal memproses import' });
    }
});

// POST /api/items - Create new item with relations
router.post('/', async (req: Request, res: Response) => {
    try {
        let {
            // Basic info
            name,
            code,
            categoryId,
            type,
            unit,
            description,
            barcode,
            brand,
            isActive,
            serialNumberActive,

            // Pricing
            sellPrice,
            purchasePrice,
            defaultDiscount,
            wholesalePrice,
            minimumJual,

            // Stock
            minStock,

            // Supplier
            primarySupplierId,
            purchaseUom,
            supplierPurchasePrice,
            minimumOrder,

            // Tax
            taxCode,
            taxRate,

            // Category product type (from form)
            kategoriProduk,
            idHppPky,

            // Accounts
            accounts, // Array of { accountType: string, accountId: string }
        } = req.body;

        // Auto-generate code if needed
        if (!code || code === 'Otomatis') {
            const prefix = 'ITM';
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            code = `${prefix}-${timestamp}-${random}`;
        }

        // Validation
        if (!name) {
            return res.status(400).json({ error: 'Nama Barang wajib diisi' });
        }

        // Get default company
        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            return res.status(500).json({ error: 'No company found' });
        }

        // Check for duplicate code
        const existingItem = await prisma.item.findFirst({
            where: {
                companyId: defaultCompany.id,
                code
            }
        });

        if (existingItem) {
            return res.status(400).json({ error: 'Kode Barang sudah ada' });
        }

        // Get or create default warehouse
        let defaultWarehouse = await prisma.warehouse.findFirst({
            where: { companyId: defaultCompany.id }
        });

        if (!defaultWarehouse) {
            defaultWarehouse = await prisma.warehouse.create({
                data: {
                    companyId: defaultCompany.id,
                    code: 'WH-DEFAULT',
                    name: 'Gudang Utama',
                    isActive: true,
                    updatedAt: new Date()
                }
            });
        }

        // Create item with relations using transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the item
            const newItem = await tx.item.create({
                data: {
                    companyId: defaultCompany.id,
                    name,
                    code,
                    categoryId: categoryId && categoryId !== 'Umum' ? categoryId : null,
                    description,
                    barcode: barcode || null,
                    uom: unit || 'PCS',
                    brand: brand || null,
                    isStockItem: type === 'Persediaan' || type !== 'Jasa',
                    serialNumberActive: serialNumberActive || false,
                    isActive: isActive !== undefined ? isActive : true,
                }
            });

            // 2. Create pricing entries
            const pricingData = [];

            if (sellPrice !== undefined && sellPrice > 0) {
                pricingData.push({
                    id: crypto.randomUUID(),
                    itemId: newItem.id,
                    priceType: 'SELL' as PriceType,
                    price: sellPrice,
                    defaultDiscount: defaultDiscount || 0,
                    minimumQuantity: minimumJual || 0,
                    currency: 'IDR',
                    isActive: true,
                    updatedAt: new Date()
                });
            }

            if (purchasePrice !== undefined && purchasePrice > 0) {
                pricingData.push({
                    id: crypto.randomUUID(),
                    itemId: newItem.id,
                    priceType: 'PURCHASE' as PriceType,
                    price: purchasePrice,
                    defaultDiscount: 0,
                    minimumQuantity: 0,
                    currency: 'IDR',
                    isActive: true,
                    updatedAt: new Date()
                });
            }

            if (wholesalePrice !== undefined && wholesalePrice > 0) {
                pricingData.push({
                    id: crypto.randomUUID(),
                    itemId: newItem.id,
                    priceType: 'WHOLESALE' as PriceType,
                    price: wholesalePrice,
                    defaultDiscount: 0,
                    minimumQuantity: 0,
                    currency: 'IDR',
                    isActive: true,
                    updatedAt: new Date()
                });
            }

            if (pricingData.length > 0) {
                await tx.itemPricing.createMany({ data: pricingData });
            }

            // 3. Create stock entries
            const openingStocks = req.body.openingStocks;

            if (Array.isArray(openingStocks) && openingStocks.length > 0) {
                // Find Equity Account for Opening Balance
                const equityAccount = await tx.account.findFirst({
                    where: {
                        companyId: defaultCompany.id,
                        name: { contains: 'Saldo Awal', mode: 'insensitive' }
                    }
                });

                // Find Inventory Account
                let inventoryAccountId = null;
                if (accounts && Array.isArray(accounts)) {
                    const invAcc = accounts.find((a: any) => a.accountType === 'INVENTORY');
                    if (invAcc) inventoryAccountId = invAcc.accountId;
                }

                // Deduplicate stocks by warehouse
                const stockMap = new Map();
                for (const stock of openingStocks) {
                    const existing = stockMap.get(stock.warehouseId);
                    if (existing) {
                        existing.quantity += Number(stock.quantity);
                        existing.totalCost += Number(stock.totalCost);
                    } else {
                        stockMap.set(stock.warehouseId, {
                            ...stock,
                            quantity: Number(stock.quantity),
                            totalCost: Number(stock.totalCost)
                        });
                    }
                }

                for (const stock of Array.from(stockMap.values())) {
                    const { warehouseId, quantity, totalCost } = stock;

                    await tx.itemStock.create({
                        data: {
                            id: crypto.randomUUID(),
                            itemId: newItem.id,
                            warehouseId: warehouseId,
                            minStock: minStock || 0,
                            maxStock: 0,
                            currentStock: quantity,
                            reservedStock: 0,
                            availableStock: quantity,
                            reorderPoint: minStock || 0,
                            updatedAt: new Date()
                        }
                    });

                    // Create Inventory Transaction for Initial Stock
                    await tx.inventoryTransaction.create({
                        data: {
                            id: crypto.randomUUID(),
                            companyId: defaultCompany.id,
                            itemId: newItem.id,
                            warehouseId: warehouseId,
                            transactionDate: new Date(stock.date || new Date()),
                            transactionType: 'INITIAL',
                            referenceNo: 'OPENING',
                            quantity: quantity, // Use exact quantity
                            unit: stock.unit || 'PCS',
                            costPerUnit: stock.costPerUnit || 0,
                            totalCost: totalCost,
                            notes: `Stok Awal - ${newItem.name}`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            createdBy: 'SYSTEM'
                        }
                    });

                    // Create Journal Entry if quantity > 0 and accounts exist
                    if (quantity > 0 && equityAccount && inventoryAccountId) {
                        const journal = await tx.journalEntry.create({
                            data: {
                                companyId: defaultCompany.id,
                                transactionDate: new Date(stock.date || new Date()),
                                transactionNo: `JV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                description: `Saldo Awal Stok - ${newItem.name}`,
                                sourceType: 'INVENTORY',
                                sourceId: newItem.id,
                            }
                        });

                        // Debit Inventory
                        await tx.journalLine.create({
                            data: {
                                journalId: journal.id,
                                accountId: inventoryAccountId,
                                description: `Saldo Awal Stok - ${newItem.name}`,
                                debit: totalCost,
                                credit: 0
                            }
                        });

                        // Credit Equity
                        await tx.journalLine.create({
                            data: {
                                journalId: journal.id,
                                accountId: equityAccount.id,
                                description: `Saldo Awal Stok - ${newItem.name}`,
                                debit: 0,
                                credit: totalCost
                            }
                        });
                    }
                }
            } else {
                // Default behavior: Create empty stock for default warehouse
                await tx.itemStock.create({
                    data: {
                        id: crypto.randomUUID(),
                        itemId: newItem.id,
                        warehouseId: defaultWarehouse!.id,
                        minStock: minStock || 0,
                        maxStock: 0,
                        currentStock: 0,
                        reservedStock: 0,
                        availableStock: 0,
                        reorderPoint: minStock || 0,
                        updatedAt: new Date()
                    }
                });
            }

            // 4. Create supplier relation if provided
            if (primarySupplierId) {
                await tx.itemSupplier.create({
                    data: {
                        id: crypto.randomUUID(),
                        itemId: newItem.id,
                        supplierId: primarySupplierId,
                        isPrimary: true,
                        purchaseUom: purchaseUom || unit || 'PCS',
                        purchasePrice: supplierPurchasePrice || purchasePrice || 0,
                        minimumOrder: minimumOrder || 0,
                        isActive: true,
                        updatedAt: new Date()
                    }
                });
            }

            // 5. Create tax entry if provided
            if (taxCode && taxRate) {
                await tx.itemTax.create({
                    data: {
                        id: crypto.randomUUID(),
                        itemId: newItem.id,
                        taxCode: taxCode,
                        taxName: taxCode === 'PPN' ? 'Pajak Pertambahan Nilai' : taxCode,
                        taxRate: taxRate,
                        isActive: true
                    }
                });
            }

            // 6. Create Account mappings
            if (Array.isArray(accounts) && accounts.length > 0) {
                const accountData = accounts
                    .filter((acc: any) => acc.accountId && acc.accountType)
                    .map((acc: any) => ({
                        id: crypto.randomUUID(),
                        itemId: newItem.id,
                        accountType: acc.accountType as any, // Enum
                        accountId: acc.accountId,
                        createdAt: new Date()
                    }));

                if (accountData.length > 0) {
                    await tx.itemAccount.createMany({ data: accountData });
                }
            }

            return newItem;
        });

        res.status(201).json({
            data: result,
            message: 'Barang berhasil disimpan'
        });

    } catch (error: any) {
        console.error('Error creating item:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Kode Barang harus unik' });
        }
        res.status(500).json({ error: 'Gagal menyimpan barang' });
    }
});

// PUT /api/items/:id - Update item with relations
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            code,
            categoryId,
            type,
            unit,
            description,
            barcode,
            brand,
            isActive,
            serialNumberActive,
            sellPrice,
            purchasePrice,
            defaultDiscount,
            minStock,
            primarySupplierId,
            taxCode,
            taxRate,

            // Accounts
            accounts,
        } = req.body;

        // Check item exists
        const existingItem = await prisma.item.findUnique({
            where: { id },
            include: {
                pricing: true,
                stocks: true,
                suppliers: true,
                taxes: true,
                accounts: true
            }
        });

        if (!existingItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update with transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update item
            const updatedItem = await tx.item.update({
                where: { id },
                data: {
                    name,
                    code,
                    categoryId: categoryId && categoryId !== 'Umum' ? categoryId : null,
                    description,
                    barcode: barcode || null,
                    uom: unit,
                    brand: brand || null,
                    isStockItem: type === 'Persediaan',
                    serialNumberActive,
                    isActive,
                }
            });

            // 2. Update or create SELL pricing
            if (sellPrice !== undefined) {
                const existingSellPrice = existingItem.pricing.find(p => p.priceType === 'SELL');
                if (existingSellPrice) {
                    await tx.itemPricing.update({
                        where: { id: existingSellPrice.id },
                        data: {
                            price: sellPrice,
                            defaultDiscount: defaultDiscount || 0,
                        }
                    });
                } else {
                    await tx.itemPricing.create({
                        data: {
                            id: crypto.randomUUID(),
                            itemId: id,
                            priceType: 'SELL',
                            price: sellPrice,
                            defaultDiscount: defaultDiscount || 0,
                            currency: 'IDR',
                            isActive: true,
                            updatedAt: new Date()
                        }
                    });
                }
            }

            // 3. Update or create PURCHASE pricing
            if (purchasePrice !== undefined) {
                const existingPurchasePrice = existingItem.pricing.find(p => p.priceType === 'PURCHASE');
                if (existingPurchasePrice) {
                    await tx.itemPricing.update({
                        where: { id: existingPurchasePrice.id },
                        data: { price: purchasePrice }
                    });
                } else {
                    await tx.itemPricing.create({
                        data: {
                            id: crypto.randomUUID(),
                            itemId: id,
                            priceType: 'PURCHASE',
                            price: purchasePrice,
                            currency: 'IDR',
                            isActive: true,
                            updatedAt: new Date()
                        }
                    });
                }
            }

            // 4. Update stock minStock if provided
            if (minStock !== undefined && existingItem.stocks.length > 0) {
                await tx.itemStock.update({
                    where: { id: existingItem.stocks[0].id },
                    data: {
                        minStock,
                        reorderPoint: minStock
                    }
                });
            }

            // 5. Update Accounts
            if (Array.isArray(accounts)) {
                // Delete existing mappings
                await tx.itemAccount.deleteMany({
                    where: { itemId: id }
                });

                // Create new mappings
                const accountData = accounts
                    .filter((acc: any) => acc.accountId && acc.accountType)
                    .map((acc: any) => ({
                        id: crypto.randomUUID(),
                        itemId: id,
                        accountType: acc.accountType as any,
                        accountId: acc.accountId,
                        createdAt: new Date()
                    }));

                if (accountData.length > 0) {
                    await tx.itemAccount.createMany({ data: accountData });
                }
            }

            // 6. Handle Opening Stocks in Edit Mode (Append only)
            const openingStocks = req.body.openingStocks;
            if (Array.isArray(openingStocks) && openingStocks.length > 0) {
                // Determine IDs for journal (re-fetch needed or pass from body? usually implied)
                const companyId = existingItem.companyId;

                // Find Equity Account
                const equityAccount = await tx.account.findFirst({
                    where: {
                        companyId: companyId,
                        name: { contains: 'Saldo Awal', mode: 'insensitive' }
                    }
                });

                // Find Inventory Account
                let inventoryAccountId = null;
                if (accounts && Array.isArray(accounts)) {
                    const invAcc = accounts.find((a: any) => a.accountType === 'INVENTORY');
                    if (invAcc) inventoryAccountId = invAcc.accountId;
                } else {
                    // Try to get from existing accounts if not updated
                    const existingInvAcc = existingItem.accounts.find(a => a.accountType === 'INVENTORY');
                    if (existingInvAcc) inventoryAccountId = existingInvAcc.accountId;
                }

                // Deduplicate stocks by warehouse
                const stockMap = new Map();
                for (const stock of openingStocks) {
                    const existing = stockMap.get(stock.warehouseId);
                    if (existing) {
                        existing.quantity += Number(stock.quantity);
                        existing.totalCost += Number(stock.totalCost);
                    } else {
                        stockMap.set(stock.warehouseId, {
                            ...stock,
                            quantity: Number(stock.quantity),
                            totalCost: Number(stock.totalCost)
                        });
                    }
                }

                for (const stock of Array.from(stockMap.values())) {
                    const { warehouseId, quantity, totalCost } = stock;

                    // Upsert ItemStock
                    const existingStock = await tx.itemStock.findFirst({
                        where: { itemId: id, warehouseId }
                    });

                    if (existingStock) {
                        await tx.itemStock.update({
                            where: { id: existingStock.id },
                            data: {
                                currentStock: { increment: quantity },
                                availableStock: { increment: quantity },
                                updatedAt: new Date()
                            }
                        });
                    } else {
                        await tx.itemStock.create({
                            data: {
                                id: crypto.randomUUID(),
                                itemId: id,
                                warehouseId: warehouseId,
                                minStock: minStock || 0,
                                maxStock: 0,
                                currentStock: quantity,
                                reservedStock: 0,
                                availableStock: quantity, // Assume initial stock is available
                                reorderPoint: minStock || 0,
                                updatedAt: new Date()
                            }
                        });
                    }

                    // Create Inventory Transaction
                    await tx.inventoryTransaction.create({
                        data: {
                            id: crypto.randomUUID(),
                            companyId: companyId,
                            itemId: id,
                            warehouseId: warehouseId,
                            transactionDate: new Date(stock.date || new Date()),
                            transactionType: 'INITIAL',
                            referenceNo: 'OPENING-EDIT',
                            quantity: quantity,
                            unit: stock.unit || 'PCS',
                            costPerUnit: stock.costPerUnit || 0,
                            totalCost: totalCost,
                            notes: `Tambahan Stok Awal - ${name}`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            createdBy: 'SYSTEM'
                        }
                    });

                    // Journal Entry
                    if (quantity > 0 && equityAccount && inventoryAccountId) {
                        const journal = await tx.journalEntry.create({
                            data: {
                                companyId: companyId,
                                transactionDate: new Date(stock.date || new Date()),
                                transactionNo: `JV-EDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                description: `Tambahan Saldo Awal Stok - ${name}`,
                                sourceType: 'INVENTORY',
                                sourceId: id,
                            }
                        });

                        await tx.journalLine.create({
                            data: {
                                journalId: journal.id,
                                accountId: inventoryAccountId,
                                description: `Tambahan Saldo Awal Stok - ${name}`,
                                debit: totalCost,
                                credit: 0
                            }
                        });

                        await tx.journalLine.create({
                            data: {
                                journalId: journal.id,
                                accountId: equityAccount.id,
                                description: `Tambahan Saldo Awal Stok - ${name}`,
                                debit: 0,
                                credit: totalCost
                            }
                        });
                    }
                }
            }

            return updatedItem;
        });

        res.json({
            data: result,
            message: 'Barang berhasil diupdate'
        });

    } catch (error: any) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Gagal mengupdate barang' });
    }
});


// DELETE /api/items/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if item exists
        const item = await prisma.item.findUnique({ where: { id } });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Delete item (cascade will handle related records)
        await prisma.item.delete({ where: { id } });

        res.json({ message: 'Barang berhasil dihapus' });

    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Gagal menghapus barang' });
    }
});

// ============================================================================
// CATEGORY ENDPOINTS
// ============================================================================

// GET /api/items/categories
router.get('/categories/list', async (req: Request, res: Response) => {
    try {
        const categories = await prisma.itemCategory.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: {
                parent: {
                    select: { name: true }
                },
                _count: {
                    select: { items: true }
                }
            }
        });

        res.json({ data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// POST /api/items/categories
router.post('/categories', async (req: Request, res: Response) => {
    try {
        const { code, name, description, parentId, productType, hppAccountId } = req.body;

        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            return res.status(500).json({ error: 'No company found' });
        }

        const category = await prisma.itemCategory.create({
            data: {
                id: crypto.randomUUID(),
                companyId: defaultCompany.id,
                code,
                name,
                description,
                parentId,
                productType,
                hppAccountId,
                isActive: true,
                updatedAt: new Date()
            }
        });

        res.status(201).json({ data: category });
    } catch (error: any) {
        console.error('Error creating category:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Kode kategori sudah ada' });
        }
        res.status(500).json({ error: 'Gagal membuat kategori' });
    }
});

// ============================================================================
// WAREHOUSE ENDPOINTS
// ============================================================================

// GET /api/items/warehouses
router.get('/warehouses/list', async (req: Request, res: Response) => {
    try {
        const warehouses = await prisma.warehouse.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        res.json({ data: warehouses });
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        res.status(500).json({ error: 'Failed to fetch warehouses' });
    }
});

export default router;
