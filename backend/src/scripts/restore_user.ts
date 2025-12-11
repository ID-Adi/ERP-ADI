
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Restoring Admin User ---');

    // 1. Find the existing company
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('[ERROR] No company found! Cannot restore user.');
        process.exit(1);
    }
    console.log(`Found Company: ${company.name} (${company.id})`);

    // 2. Hash password
    // 2. Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 3. Create User
    const email = 'admin@erp-adi.com';

    // Upsert to handle re-runs safe-ish (though we expect it to likely be missing)
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            companyId: company.id,
            isActive: true,
            role: 'ADMIN',
            name: 'Demo Admin'
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Demo Admin',
            role: 'ADMIN',
            companyId: company.id,
        }
    });

    console.log(`
[SUCCESS] User restored/created!
---------------------------------------------------
Email:    ${user.email}
Password: admin123
Company:  ${company.name} (${company.id})
---------------------------------------------------
PLEASE LOG OUT AND LOG IN WITH THESE CREDENTIALS.
    `);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
