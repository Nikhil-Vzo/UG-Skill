const { Client } = require('pg');
const axios = require('axios');

async function test() {
  const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/ugskill' });
  await c.connect();
  const res = await c.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  const adminId = res.rows[0]?.id;
  await c.end();

  console.log('Admin ID:', adminId);
  
  if (!adminId) return;

  try {
    const data = {
      title: 'Test Exam ' + Date.now(),
      examType: 'Mock Test',
      durationMinutes: 60,
      targetExamTags: [],
      mode: 'scheduled',
      status: 'draft',
      totalMarks: 100,
      passPercent: 40,
      negativeMarking: 0.25,
      isProctored: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      isPasswordProtected: false,
      instructions: '<p>test</p>',
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

    // We can't hit the API directly without auth, but wait, we can just call examService!
    // Since we are running in the context of node, we'd need ts-node or just use axios to the local running instance.
    // Wait, the local instance is running on port 5000? Let's check `ugskill-api/.env` for port.
    // Assuming port 3000 or 5000. Let's look for a valid session token instead.
    
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
test();
