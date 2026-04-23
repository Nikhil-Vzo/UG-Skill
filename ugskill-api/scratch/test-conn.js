const postgres = require('postgres');
const sql = postgres({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.oemnltyocalaqeccagkk',
  password: '*S?E/n4H3Tk*NWQ',
  ssl: 'require',
  max: 1,
  connect_timeout: 10,
});
sql`SELECT 1 as test`.then(r => {
  console.log('SUCCESS:', JSON.stringify(r));
  process.exit(0);
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
