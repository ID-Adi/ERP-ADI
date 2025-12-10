const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@erp-adi.com';
    const password = 'admin123';
    // Find first company or throw error
    const company = await prisma.company.findFirst();
    if (!company) {
        throw new Error("No company found! Please run 'npx prisma db seed' first.");
    }
    const companyId = company.id;

    console.log(`Checking for user: ${email}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log('User exists. Updating password and company...');
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                companyId: companyId,
                isActive: true,
                role: 'ADMIN' // Ensure admin role
            }
        });
        console.log('User updated successfully.');
    } else {
        console.log('User does not exist. Creating new user...');
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Administrator',
                companyId: companyId,
                role: 'ADMIN',
                isActive: true,
            }
        });
        console.log('User created successfully.');
    }

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
