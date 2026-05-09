const postgres = require('postgres');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '7b4d9a2c3e1f8a5d6b0c9e8f7a6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d';
const DB_URL = 'postgresql://postgres.oemnltyocalaqeccagkk:%2AS%3FE%2Fn4H3Tk%2ANWQ@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

async function test() {
  const sql = postgres(DB_URL);

  const adminRes = await sql`SELECT id, email, roles FROM users WHERE 'admin' = ANY(roles) LIMIT 1`;
  const admin = adminRes[0];
  if (!admin) {
    console.log('No admin found');
    await sql.end();
    return;
  }
  await sql.end();

  console.log('Admin found:', admin.id, admin.email, admin.roles);

  // Mint a fresh access token
  const accessToken = jwt.sign(
    { userId: admin.id, email: admin.email, roles: admin.roles },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('Access Token (first 50 chars):', accessToken.substring(0, 50) + '...');

  const payload = {
    title: 'Debug Exam ' + Date.now(),
    examType: 'practice',
    durationMinutes: 60,
    mode: 'scheduled',
    status: 'draft',
    totalMarks: 100,
    passPercent: 40,
    negativeMarking: 0.25,
    isProctored: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    instructions: '<p>debug</p>',
    windowStart: new Date().toISOString(),
    windowEnd: new Date(Date.now() + 3600000).toISOString(),
    mongoDefinition: {
      sections: [
        {
          name: "Section 1",
          sectionOrder: 1,
          timeLimitMinutes: null,
          maxMarks: 10,
          negativeMarking: 0.25,
          isLocked: false,
          navigationMode: "free"
        }
      ]
    }
  };

  try {
    const res = await axios.post('http://localhost:4000/api/v1/exams', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('\n✅ SUCCESS:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('\n❌ Request failed with:', e.response?.status);
    console.log(JSON.stringify(e.response?.data || e.message, null, 2));
  }
}

test().catch(console.error);
