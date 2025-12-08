
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Check distinct UOMs in Item table
        const items = await prisma.item.findMany({
            select: { uom: true },
            distinct: ['uom']
        });
        console.log(`Found ${items.length} distinct UOMs in Item table:`);
        console.log(items.map(i => i.uom));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
