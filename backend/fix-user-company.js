const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get valid company
    const company = await prisma.company.findFirst();
    console.log('Valid company:', company?.id, company?.name);

    // Get current user
    const user = await prisma.user.findFirst();
    console.log('Current user:', user?.id, user?.email, 'companyId:', user?.companyId);

    if (user && company && user.companyId !== company.id) {
        // Update user companyId to valid one
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { companyId: company.id }
        });
        console.log('Updated user:', updated.id, 'new companyId:', updated.companyId);
    } else {
        console.log('No update needed or no user found');
    }

    await prisma.$disconnect();
}

main().catch(console.error);
