
const { Client } = require('pg');

const configs = [
    {
        name: 'Direct IPv6 (Literal)',
        connectionString: 'postgresql://postgres:%40Head_Office_CC1@[2406:da18:243:741d:c321:ea2d:39a6:b90c]:5432/postgres'
    },
    {
        name: 'Pooler (Regional - Transaction)',
        connectionString: 'postgresql://postgres.vbnkuwbptmbvsnmykvuz:%40Head_Office_CC1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    },
    {
        name: 'Pooler (Regional - Session)',
        connectionString: 'postgresql://postgres.vbnkuwbptmbvsnmykvuz:%40Head_Office_CC1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
    },
    {
        name: 'Pooler (Global - Transaction)',
        connectionString: 'postgresql://postgres.vbnkuwbptmbvsnmykvuz:%40Head_Office_CC1@pooler.supabase.com:6543/postgres?pgbouncer=true'
    }
];

async function testConnection(config) {
    console.log(`\nTesting: ${config.name}...`);
    const client = new Client({
        connectionString: config.connectionString,
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log('✅ SUCCESS!');
        await client.end();
        return true;
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        // console.log(err);
        client.end().catch(() => { });
        return false;
    }
}

async function run() {
    for (const config of configs) {
        await testConnection(config);
    }
}

run();
