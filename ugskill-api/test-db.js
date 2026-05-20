const postgres = require('postgres');

async function test() {
  console.log('Connecting to database...');
  const sql = postgres('postgresql://postgres.oemnltyocalaqeccagkk:%2AS%3FE%2Fn4H3Tk%2ANWQ@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres');
  
  try {
    const res = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `;
    console.log('Columns in public.users:');
    console.log(res.filter(c => ['id', 'email', 'resume_url', 'resume_data'].includes(c.column_name)));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}
test();
