
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
    console.log('Login successful. Token acquired.');

    console.log('Fetching exams...');
    const examsRes = await axios.get(`${API_URL}/exams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Exams Response Status:', examsRes.status);
    console.log('Exams Response Data:', JSON.stringify(examsRes.data, null, 2));
    
    process.exit(0);
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
