const postgres = require('postgres');

async function test() {
  const sql = postgres('postgresql://postgres.oemnltyocalaqeccagkk:%2AS%3FE%2Fn4H3Tk%2ANWQ@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres');
  
  try {
    const drives = await sql`
      SELECT id, name, created_by, status FROM company_drives
    `;
    console.log('Drives in company_drives:');
    console.log(drives);

    const registrations = await sql`
      SELECT id, drive_id, student_id, status FROM drive_registrations
    `;
    console.log('Drive Registrations:');
    console.log(registrations);

    const sessions = await sql`
      SELECT id, student_id, session_type, drive_id, status FROM placement_sessions
    `;
    console.log('Placement Sessions:');
    console.log(sessions);
    const users = await sql`
      SELECT id, email, fullName, roles FROM users
    `;
    console.log('Users:');
    console.log(users);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}
test();
