import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
      const companyId = 'default-company'; // Ensure this matches your default company ID

      // Check if company exists, if not create it (optional, but good for safety)
      let company = await prisma.company.findUnique({ where: { code: 'CMP-001' } });
      if (!company) {
            // Try to find any company
            const firstCompany = await prisma.company.findFirst();
            if (firstCompany) {
                  company = firstCompany;
            } else {
                  console.log('Creating default company...');
                  company = await prisma.company.create({
                        data: {
                              code: 'CMP-001',
                              name: 'Default Company',
                              email: 'admin@example.com'
                        }
                  });
            }
      }

      const warehouse = await prisma.warehouse.findFirst({
            where: { companyId: company.id }
      });

      if (!warehouse) {
            console.log('Seeding default warehouse...');
            await prisma.warehouse.create({
                  data: {
                        companyId: company.id,
                        code: 'WH-001',
                        name: 'Gudang Utama',
                        address: 'Jl. Raya No. 1',
                        city: 'Jakarta'
                  }
            });
            console.log('Default warehouse created.');
      } else {
            console.log('Warehouse already exists:', warehouse.name);
      }
}

main()
      .catch((e) => {
            console.error(e);
            process.exit(1);
      })
      .finally(async () => {
            await prisma.$disconnect();
      });
