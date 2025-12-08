
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Is receivableAccountId in Customer fields?');
    const dmmf = (prisma as any)._baseDmmf;
    if (dmmf) {
        const customerModel = dmmf.modelMap.Customer;
        if (customerModel) {
            const field = customerModel.fields.find((f: any) => f.name === 'receivableAccountId');
            console.log('Field definition in DMMF:', field);
        } else {
            console.log('Customer model not found in DMMF');
        }
    } else {
        console.log('Could not access DMMF');
    }

    try {
        console.log('Attempting dry-run validation...');
        // We validate by creating a transaction that we expect to fail or rollback, 
        // but here we just want to see if the arguments are accepted validation-wise.
        // We allow an invalid ID connection to fail naturally, or checking validation only.

        // Actually, checking "PrismaClientValidationError" is the goal.
        // We'll try to create with the field.
        // We use a dummy companyId that likely doesn't exist, so we expect a foreign key constraint error,
        // NOT an "Unknown argument" error.
        await prisma.customer.create({
            data: {
                code: "TEST-DEBUG-" + Date.now(),
                name: "Debug Customer",
                companyId: "dummy-company-id", // FK failure expected
                receivableAccountId: null
            }
        });
    } catch (e: any) {
        console.log('CAUGHT ERROR:', e.message);
        if (e.message.includes('Unknown argument')) {
            console.log('FAIL: The unknown argument error persists.');
        } else if (e.message.includes('Foreign key constraint') || e.code === 'P2003') {
            console.log('SUCCESS: Validation passed (FK error expected).');
        } else {
            console.log('OTHER ERROR:', e.code, e.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
