const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting customer seed...');

    // 1. Get Company
    const company = await prisma.company.findFirst();
    if (!company) {
        throw new Error("No company found! Please run 'npx prisma db seed' first.");
    }
    const companyId = company.id;

    // 2. Generate 100 Customers
    const customers = [];
    for (let i = 1; i <= 100; i++) {
        const code = `CUST-${String(i).padStart(3, '0')}`;
        customers.push({
            companyId,
            code,
            name: `Customer ${i} Corp`,
            email: `contact@cust${i}.com`,
            phone: `081234567${String(i).padStart(3, '0')}`,
            billingAddress: `Jl. Industri No. ${i}, Jakarta`,
            billingCity: 'Jakarta',
            // status: 'ACTIVE', // Removed: Not in schema, uses isActive
            category: i % 2 === 0 ? 'Retail' : 'Wholesale',
            isActive: true,
        });
    }

    console.log(`Preparing to insert ${customers.length} customers...`);

    // 3. Insert in batches or createMany
    // Note: createMany is supported in Postgres
    const result = await prisma.customer.createMany({
        data: customers,
        skipDuplicates: true, // Skip if code already exists
    });

    console.log(`✅ Successfully added ${result.count} customers.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
