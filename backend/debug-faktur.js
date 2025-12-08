

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching invoices with params...");
        const fakturs = await prisma.faktur.findMany({
            skip: 0,
            take: 20,
            orderBy: { fakturDate: 'desc' },
            include: {
                customer: {
                    select: { name: true }
                }
            }
        });

        console.log("Fetched raw:", fakturs.length);

        const formatted = fakturs.map(faktur => {
            try {
                return {
                    id: faktur.id,
                    fakturNumber: faktur.fakturNumber,
                    customerName: faktur.customer ? faktur.customer.name : 'Unknown', // Potentially null?
                    description: faktur.notes || (faktur.customer ? faktur.customer.name : ''),
                    fakturDate: faktur.fakturDate.toISOString().split('T')[0],
                    salesPerson: faktur.createdBy || 'Unknown',
                    total: Number(faktur.totalAmount),
                    status: faktur.status
                };
            } catch (err) {
                console.error("Error mapping faktur:", faktur.id, err);
                throw err;
            }
        });
        console.log("Success formatted:", formatted.slice(0, 1));
    } catch (e) {
        console.error("Error fetching invoices:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
