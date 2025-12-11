import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePaymentTerms() {
    console.log('Starting payment terms migration...');

    try {
        // Get all customers with legacy integer paymentTerms but no paymentTermId
        const customers = await prisma.customer.findMany({
            where: {
                AND: [
                    { paymentTerms: { not: 0 } },
                    { paymentTermId: null }
                ]
            }
        });

        console.log(`Found ${customers.length} customers to migrate`);

        for (const customer of customers) {
            const days = customer.paymentTerms;

            // Find or create matching PaymentTerm
            let paymentTerm = await prisma.paymentTerm.findFirst({
                where: {
                    companyId: customer.companyId,
                    days: days
                }
            });

            if (!paymentTerm) {
                // Create new payment term
                paymentTerm = await prisma.paymentTerm.create({
                    data: {
                        companyId: customer.companyId,
                        code: `NET${days}`,
                        name: `Net ${days} Days`,
                        days: days
                    }
                });
                console.log(`Created PaymentTerm: ${paymentTerm.name}`);
            }

            // Update customer
            await prisma.customer.update({
                where: { id: customer.id },
                data: { paymentTermId: paymentTerm.id }
            });

            console.log(`Migrated customer ${customer.code}: ${days} days -> ${paymentTerm.name}`);
        }

        console.log('✓ Migration complete!');
        console.log(`✓ Migrated ${customers.length} customers`);
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

migratePaymentTerms()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
