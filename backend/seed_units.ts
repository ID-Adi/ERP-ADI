
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fetching distinct UOMs from items...');
        // 1. Get distinct UOMs
        const items = await prisma.item.findMany({
            select: { uom: true },
            distinct: ['uom']
        });

        const uoms = items.map(i => i.uom).filter(Boolean); // Filter nulls if any
        console.log('Found UOMs:', uoms);

        if (uoms.length === 0) {
            console.log('No UOMs found to seed.');
            return;
        }

        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
            console.error('No company found!');
            return;
        }

        // 2. Insert into Unit table
        console.log('Seeding Units...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const name of uoms) {
            // Check if exists
            const existing = await prisma.unit.findFirst({
                where: {
                    companyId: defaultCompany.id,
                    name: { equals: name, mode: 'insensitive' }
                }
            });

            if (!existing) {
                await prisma.unit.create({
                    data: {
                        companyId: defaultCompany.id,
                        name: name,
                        isActive: true
                    }
                });
                console.log(`Created unit: ${name}`);
                createdCount++;
            } else {
                console.log(`Unit already exists: ${name}`);
                skippedCount++;
            }
        }

        console.log(`Seeding complete. Created: ${createdCount}, Skipped: ${skippedCount}`);

    } catch (e) {
        console.error('Error seeding units:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
