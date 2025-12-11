import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Company
    const company = await prisma.company.upsert({
        where: { code: 'DEF' },
        update: {},
        create: {
            code: 'DEF',
            name: 'Default Company',
            address: '123 Main St',
            email: 'info@company.com'
        }
    });

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 2. Create User
    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
            password: hashedPassword, // Ensure password is valid
            companyId: company.id
        },
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN',
            companyId: company.id
        }
    });

    // 3. Create Customers
    const customers = [];
    for (let i = 1; i <= 5; i++) {
        const char = String.fromCharCode(65 + i); // A, B, C...
        customers.push(await prisma.customer.upsert({
            where: { companyId_code: { companyId: company.id, code: `CUST00${i}` } },
            update: {},
            create: {
                companyId: company.id,
                code: `CUST00${i}`,
                name: `Customer ${char}`,
                email: `customer${i}@example.com`,
                priceCategory: 'UMUM',
                discountCategory: 'UMUM'
            }
        }));
    }

    // 4. Create Warehouse
    const warehouse = await prisma.warehouse.upsert({
        where: { companyId_code: { companyId: company.id, code: 'WH-MAIN' } },
        update: {},
        create: {
            companyId: company.id,
            code: 'WH-MAIN',
            name: 'Main Warehouse',
            isActive: true
        }
    });

    // 5. Create Items
    const items = [];
    for (let i = 1; i <= 5; i++) {
        items.push(await prisma.item.upsert({
            where: { companyId_code: { companyId: company.id, code: `ITEM00${i}` } },
            update: {},
            create: {
                companyId: company.id,
                code: `ITEM00${i}`,
                name: `Item Product ${i}`,
                uom: 'PCS',
                isStockItem: true,
                pricing: {
                    create: [
                        { priceType: 'SELL', price: 15000 * i, currency: 'IDR' },
                        { priceType: 'PURCHASE', price: 10000 * i, currency: 'IDR' }
                    ]
                },
                stocks: {
                    create: {
                        warehouseId: warehouse.id,
                        currentStock: 100,
                        availableStock: 100
                    }
                }
            }
        }));
    }

    // 5. Create Sales Orders (Pesanan)
    console.log('Seeding Sales Orders...');
    for (let i = 1; i <= 10; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        await prisma.salesOrder.create({
            data: {
                companyId: company.id,
                orderNumber: `SO-2024-${1000 + i}`,
                orderDate: new Date(),
                customerId: customer.id,
                status: i % 2 === 0 ? 'CONFIRMED' : 'DRAFT',
                totalAmount: 30000,
                subtotal: 30000,
                lines: {
                    create: [
                        {
                            description: items[0].name,
                            quantity: 2,
                            unitPrice: 15000,
                            amount: 30000,
                            itemId: items[0].id
                        }
                    ]
                }
            }
        });
    }

    // 6. Create Fekturs (Faktur)
    console.log('Seeding Fakturs...');
    for (let i = 1; i <= 10; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        await prisma.faktur.create({
            data: {
                companyId: company.id,
                fakturNumber: `INV-2024-${5000 + i}`,
                fakturDate: new Date(),
                customerId: customer.id,
                status: i % 3 === 0 ? 'PAID' : (i % 3 === 1 ? 'UNPAID' : 'OVERDUE'),
                totalAmount: 30000 * (i + 1),
                subtotal: 30000 * (i + 1),
                balanceDue: i % 3 === 0 ? 0 : 30000 * (i + 1),
                amountPaid: i % 3 === 0 ? 30000 * (i + 1) : 0,
                lines: {
                    create: [
                        {
                            description: items[1].name,
                            itemName: items[1].name,
                            quantity: 2 * (i + 1),
                            unitPrice: 15000,
                            amount: 30000 * (i + 1),
                            itemId: items[1].id
                        }
                    ]
                }
            }
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
