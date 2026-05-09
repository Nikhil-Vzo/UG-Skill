const postgres = require('postgres');

async function test() {
  const sql = postgres('postgresql://postgres.oemnltyocalaqeccagkk:%2AS%3FE%2Fn4H3Tk%2ANWQ@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres');
  
  try {
    const res = await sql`SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'exams_exam_type_check'`;
    console.log('Constraint:', res);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}
test();
