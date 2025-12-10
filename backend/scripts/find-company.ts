import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
      const company = await prisma.company.findFirst();
      console.log('Company ID:', company?.id);
      console.log('Company Code:', company?.code);
}

main()
      .catch(e => console.error(e))
      .finally(async () => await prisma.$disconnect());
