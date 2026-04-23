const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.PG_DATABASE_URL);

async function test() {
  console.log('Testing connection to:', process.env.PG_DATABASE_URL.replace(/:.+@/, ':****@'));
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log('Success:', result);
  } catch (err) {
    console.error('Connection failed:');
    console.error(err);
  } finally {
    process.exit();
  }
}

test();
