import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if company exists, if not create one
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'ADI Corp',
                code: 'ADI',
                address: 'Jakarta',
                phone: '08123456789'
            }
        });
        console.log('Created Company:', company.id);
    } else {
        console.log('Using existing Company:', company.id);
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            companyId: company.id,
            role: 'ADMIN',
            isActive: true
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN',
            companyId: company.id,
            isActive: true
        }
    });

    console.log(`User ${user.email} managed with ID: ${user.id}`);
    console.log(`Password set to: ${password}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
