import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class ItemService {
    /**
     * Generate unique item code with collision detection
     * Format: ITM-YYYYMMDDHHmmssSSS
     * With counter fallback if collision occurs
     */
    async generateItemCode(companyId: string, tx?: Prisma.TransactionClient): Promise<string> {
        const db = tx || prisma;
        const now = new Date();

        // Format: ITM-YYYYMMDDHHmmssSSS (with milliseconds for uniqueness)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const millis = String(now.getMilliseconds()).padStart(3, '0');

        let candidate = `ITM-${year}${month}${day}${hours}${minutes}${seconds}${millis}`;

        // Collision safety loop (should be extremely rare with milliseconds)
        let counter = 0;
        while (true) {
            const exists = await db.item.count({
                where: { companyId, code: candidate }
            });
            if (exists === 0) break;
            counter++;
            candidate = `ITM-${year}${month}${day}${hours}${minutes}${seconds}${millis}-${counter}`;
        }

        return candidate;
    }
}

export default new ItemService();
