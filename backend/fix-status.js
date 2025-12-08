const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Manually adding Enum values...");
        const enumsToAdd = ['PENDING', 'REJECTED', 'UNPAID'];

        for (const val of enumsToAdd) {
            try {
                // ADD VALUE IF NOT EXISTS is only PG 12+. If it fails, we assume it might exist or different error.
                // Standard syntax is ALTER TYPE ... ADD VALUE 'VAL';
                await prisma.$executeRawUnsafe(`ALTER TYPE "FakturStatus" ADD VALUE '${val}'`);
                console.log(`Added ${val} to Enum`);
            } catch (e) {
                // Code 42710 (duplicate_object) or 'already exists' in message
                if (e.message && (e.message.includes('already exists') || e.meta?.code === '42710' || e.code === 'P2010')) {
                    console.log(`${val} already exists in Enum (or skipped)`);
                } else {
                    console.warn(`Could not add ${val}:`, e.message);
                }
            }
        }

        console.log("Updating ISSUED statuses to UNPAID...");
        // This cast might fail if ISSUED is considered 'invalid' by Prisma but it should work in raw SQL if we cast to text then to new enum?
        // Actually, if 'ISSUED' is currently in the enum, we don't need to cast to text.
        // But if we want to be safe: 
        const count = await prisma.$executeRawUnsafe(`UPDATE "Faktur" SET status = 'UNPAID' WHERE status::text = 'ISSUED'`);

        console.log("Updated rows:", count);
    } catch (e) {
        console.error("Error in fix script:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
