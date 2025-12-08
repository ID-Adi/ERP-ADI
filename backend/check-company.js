const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany({ take: 5 });
    console.log('Companies in database:', companies);

    const specificCompany = await prisma.company.findUnique({
        where: { id: 'a5eaf0f6-3755-4fb0-82d8-bd5a10183f06' }
    });
    console.log('Specific company:', specificCompany);

    await prisma.$disconnect();
}

main().catch(console.error);
