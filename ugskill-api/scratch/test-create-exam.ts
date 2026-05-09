
import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1';

async function test() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ugskill.com',
      password: 'Admin@123'
    });
    
    const token = loginRes.data.data.accessToken;
    console.log('Login successful.');

    console.log('Creating exam...');
    const payload = {
      title: 'Test Exam ' + Date.now(),
      durationMinutes: 60,
      totalMarks: 100,
      passPercent: 40,
      isProctored: true,
      status: 'draft'
    };

    const res = await axios.post(`${API_URL}/exams`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Create Exam Response Status:', res.status);
    console.log('Create Exam Response Data:', JSON.stringify(res.data, null, 2));
    
    process.exit(0);
  } catch (err: any) {
    console.error('Error:', JSON.stringify(err.response?.data || err.message, null, 2));
    process.exit(1);
  }
}

test();
