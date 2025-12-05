// Quick test script to check database connectivity
const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.oxzgpjektowmrtkmxaye',
  password: 'fqPQ5Rr2l08K1p82',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const result = await client.query('SELECT version();');
    console.log('✅ Query executed:', result.rows[0]);

    await client.end();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
