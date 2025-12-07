
const dns = require('dns');

console.log('Testing DNS resolution...');

// 1. Google
dns.lookup('google.com', (err, address, family) => {
    console.log('Google.com:', err ? err.message : address);
});

// 2. Supabase
dns.lookup('db.vbnkuwbptmbvsnmykvuz.supabase.co', (err, address, family) => {
    console.log('Supabase DB:', err ? err.message : address);
});

// 3. Supabase API (different subdomain)
dns.lookup('vbnkuwbptmbvsnmykvuz.supabase.co', (err, address, family) => {
    console.log('Supabase API:', err ? err.message : address);
});
