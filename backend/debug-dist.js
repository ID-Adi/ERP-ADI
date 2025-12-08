
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- DEBUG DIST START ---');
    try {
        // Check DMMF if possible
        const dmmf = prisma._baseDmmf;
        if (dmmf && dmmf.modelMap && dmmf.modelMap.Customer) {
            const hasField = dmmf.modelMap.Customer.fields.some(f => f.name === 'receivableAccountId');
            console.log('DMMF Customer has receivableAccountId:', hasField);
        } else {
            console.log('DMMF or Customer model not available');
        }

        // Attempt creation
        await prisma.customer.create({
            data: {
                code: "TEST-DIST-" + Date.now(),
                name: "Debug Dist Customer",
                companyId: "dummy-company-id",
                receivableAccountId: null
            }
        });
    } catch (e) {
        console.log('CAUGHT ERROR:', e.message);
        if (e.message.includes('Unknown argument')) {
            console.log('FAIL: Unknown argument error.');
        } else if (e.message.includes('Foreign key constraint') || e.code === 'P2003') {
            console.log('SUCCESS: Validation passed (FK error expected).');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
