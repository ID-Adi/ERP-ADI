
import { PrismaClient, AccountType } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FILE_PATH = path.join(__dirname, '../../Docs/akun-perkiraan.xlsx');

// Map Excel Codes to Prisma Enum
const TYPE_MAPPING: Record<string, AccountType> = {
    'DEPR': 'ACCUMULATED_DEPRECIATION',
    'OCAS': 'OTHER_CURRENT_ASSETS',
    'FASS': 'FIXED_ASSETS',
    'BANK': 'CASH_AND_BANK',
    'EXPS': 'EXPENSE',
    'OEXP': 'OTHER_EXPENSE',
    'COGS': 'COGS',
    'APAY': 'ACCOUNTS_PAYABLE',
    'REVE': 'REVENUE',
    'EQTY': 'EQUITY',
    'LTLY': 'LONG_TERM_LIABILITIES',
    'OCLY': 'OTHER_CURRENT_LIABILITIES',
    'OINC': 'OTHER_INCOME',
    'INTR': 'INVENTORY',
    'AREC': 'ACCOUNTS_RECEIVABLE',
};

async function main() {
    console.log('🌱 Starting accounting seed...');

    // 1. Ensure Company Exists
    let company = await prisma.company.findFirst();
    if (!company) {
        console.log('Creating default company...');
        company = await prisma.company.create({
            data: {
                code: 'CMP-001',
                name: 'My Company',
                email: 'admin@example.com',
            }
        });
    }
    const companyId = company.id;

    // 1.5 Ensure Admin User Exists
    const userEmail = 'admin@example.com';
    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!existingUser) {
        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.create({
            data: {
                companyId,
                email: userEmail,
                name: 'Admin User',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
            }
        });
        console.log(`User created: ${userEmail} / password123`);
    } else {
        console.log(`User ${userEmail} already exists.`);
    }

    // 2. Read Excel File
    const workbook = xlsx.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    console.log(`Found ${rows.length} accounts to seed.`);

    // 3. First Pass: Create All Accounts (Code & Name only)
    // We skip parent setting here to avoid foreign key issues if parent doesn't exist yet
    console.log('Pass 1: Creating accounts...');

    for (const row of rows) {
        const code = String(row['Kode Perkiraan']);
        const name = row['Nama'];
        const typeCode = row['Tipe Akun'];

        if (!code || !name || !typeCode) {
            console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
            continue;
        }

        const type = TYPE_MAPPING[typeCode];
        if (!type) {
            console.warn(`Unknown type code: ${typeCode} for account ${code}`);
            continue;
        }

        // Upsert to avoid duplicates
        await prisma.account.upsert({
            where: {
                companyId_code: {
                    companyId,
                    code,
                }
            },
            update: {
                name,
                type,
                currency: row['Mata Uang'] || 'IDR',
            },
            create: {
                companyId,
                code,
                name,
                type,
                currency: row['Mata Uang'] || 'IDR',
                isHeader: false,
                level: 0,
            }
        });
    }

    // 4. Second Pass: Set Parents & Hierarchy Levels
    console.log('Pass 2: Setting hierarchy...');

    // Cache all accounts to map Code -> ID
    const allAccounts = await prisma.account.findMany({
        where: { companyId }
    });

    const codeToIdMap = new Map<string, string>();
    allAccounts.forEach(acc => codeToIdMap.set(acc.code, acc.id));

    // Identify which accounts are parents
    const parentCodes = new Set<string>();
    rows.forEach(row => {
        if (row['Akun Induk']) {
            parentCodes.add(String(row['Akun Induk']));
        }
    });

    for (const row of rows) {
        const code = String(row['Kode Perkiraan']);
        const parentCodeRaw = row['Akun Induk'];

        if (!parentCodeRaw) continue; // Root account

        const parentCode = String(parentCodeRaw);
        const accountId = codeToIdMap.get(code);
        const parentId = codeToIdMap.get(parentCode);

        if (accountId && parentId) {
            // Calculate level (simplistic: Parent Level + 1? No, simpler to just set parent relation first)
            await prisma.account.update({
                where: { id: accountId },
                data: { parentId }
            });
        } else {
            if (accountId && !parentId) {
                console.warn(`Parent account ${parentCode} not found for ${code}`);
            }
        }
    }

    // 5. Third Pass: Update isHeader and Levels (Recursive/Iterative)
    // Or simpler: update isHeader based on parentCodes
    console.log('Pass 3: Updating header status...');

    // Set isHeader = true for any account that is a parent
    for (const pCode of Array.from(parentCodes)) {
        const pId = codeToIdMap.get(pCode);
        if (pId) {
            await prisma.account.update({
                where: { id: pId },
                data: { isHeader: true }
            });
        }
    }

    // NOTE: Determining 'Level' correctly requires traversing the tree. 
    // For now, we leave default 0 or implement a simple recursion if needed, 
    // but Prisma doesn't support recursive updates easily in seed without fetching.
    // We'll skip deep level calculation for speed unless necessary for UI indentation.
    // Actually, UI indentation often relies on `level`. We should attempt to set it.

    console.log('Calculating levels...');
    // Fetch fresh tree
    const rootAccounts = await prisma.account.findMany({
        where: { companyId, parentId: null }
    });

    async function updateChildrenLevel(parentId: string, currentLevel: number) {
        const children = await prisma.account.findMany({
            where: { parentId }
        });

        for (const child of children) {
            await prisma.account.update({
                where: { id: child.id },
                data: { level: currentLevel }
            });
            await updateChildrenLevel(child.id, currentLevel + 1);
        }
    }

    for (const root of rootAccounts) {
        // Root is level 0
        await updateChildrenLevel(root.id, 1);
    }

    console.log('✅ Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
