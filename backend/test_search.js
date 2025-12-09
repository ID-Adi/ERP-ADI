const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch() {
    const searchTerm = 'ELG';
    console.log('=== Testing Prisma Search ===');
    console.log('Search Term:', searchTerm);

    // 1. Check if item exists (any item containing "Kabel" in name)
    const rawCheck = await prisma.item.findMany({
        where: { name: { contains: 'Kabel' } }, // Simple contains
        take: 1,
        select: { id: true, name: true }
    });
    console.log('Simple Contains Check:', rawCheck.length > 0 ? 'Found' : 'Not Found', rawCheck);

    // 2. Check full OR logic
    const where = {
        OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { code: { contains: searchTerm, mode: 'insensitive' } },
        ]
    };

    // 3. Dump raw items to see what is actually there!
    console.log('=== DUMPING RAW ITEMS ===');
    const allItems = await prisma.item.findMany({
        take: 1000,
        select: { id: true, name: true, code: true }
    });
    console.log('Total Fetched:', allItems.length);

    // Check for "Kabel" manually in the dump
    const manualMatches = allItems.filter(i => i.name.toLowerCase().includes('kabel'));
    console.log('Manual JS matches found:', manualMatches.length);
    if (manualMatches.length > 0) {
        console.log('Sample match:', manualMatches[0]);
    }

    try {
        const count = await prisma.item.count({ where });
        console.log('Insensitive OR Search Count:', count);

        const items = await prisma.item.findMany({
            where,
            take: 5,
            select: { name: true, code: true }
        });
        console.log('Items Found:', items);
    } catch (e) {
        console.error('Error executing query:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testSearch();
