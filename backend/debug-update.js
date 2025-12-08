const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Check customer being updated
    const customerId = '81119d40-18c6-42a3-b21c-679ac3bb0a1a';

    const customer = await prisma.customer.findUnique({
        where: { id: customerId }
    });
    console.log('Customer being updated:', customer);
    console.log('Customer companyId:', customer?.companyId);

    // Check user's company
    const user = await prisma.user.findFirst({
        where: { email: 'admin@erp-adi.com' }
    });
    console.log('User companyId:', user?.companyId);

    // Are they the same?
    if (customer && user) {
        console.log('CompanyId match:', customer.companyId === user.companyId);
    }

    await prisma.$disconnect();
}

main().catch(console.error);
