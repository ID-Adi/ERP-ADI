import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting user seed...');

    // 1. Ensure Company Exists
    let company = await prisma.company.findFirst();
    if (!company) {
        console.log('Creating default company...');
        company = await prisma.company.create({
            data: {
                code: 'CMP-ADI',
                name: 'PT ADI Indonesia',
                email: 'company@erp-adi.com',
            }
        });
        console.log(`✅ Company created: ${company.name} (ID: ${company.id})`);
    } else {
        console.log(`✅ Using existing company: ${company.name} (ID: ${company.id})`);
    }

    // 2. Seed Admin User
    const adminEmail = 'superadmin@erp-adi.com';
    const adminPassword = 'SuperAdmin@2025';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        console.log(`📝 Admin user exists, updating...`);
        await prisma.user.update({
            where: { email: adminEmail },
            data: {
                password: hashedPassword,
                companyId: company.id,
                isActive: true,
                role: 'ADMIN' as UserRole,
            }
        });
        console.log(`✅ Admin user updated: ${adminEmail}`);
    } else {
        console.log(`👤 Creating admin user...`);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'Administrator',
                companyId: company.id,
                role: 'ADMIN' as UserRole,
                isActive: true,
            }
        });
        console.log(`✅ Admin user created: ${adminEmail}`);
    }

    // 3. Display Seed Summary
    console.log('\n📊 Seed Summary:');
    console.log('─'.repeat(50));
    console.log(`Company: ${company.name}`);
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Admin Password: ${adminPassword}`);
    console.log('─'.repeat(50));
    console.log('✅ User seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });