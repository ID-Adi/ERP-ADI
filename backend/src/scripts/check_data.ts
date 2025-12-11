
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Companies ---');
    const companies = await prisma.company.findMany();
    console.table(companies.map(c => ({ id: c.id, name: c.name })));

    console.log('\n--- Users ---');
    const users = await prisma.user.findMany();
    console.table(users.map(u => ({ id: u.id, name: u.name, companyId: u.companyId, email: u.email })));

    if (users.length > 0 && companies.length === 0) {
        console.log('\n[CRITICAL] Users exist but NO Companies exist. This is the cause of the error.');
    } else {
        const danglingUsers = users.filter(u => !companies.some(c => c.id === u.companyId));
        if (danglingUsers.length > 0) {
            console.log('\n[CRITICAL] The following users have invalid companyIds:', danglingUsers.map(u => u.email));
        } else {
            console.log('\n[OK] All users have valid companyIds.');
        }
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
