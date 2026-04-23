import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const errorRate = new Rate('errors');

// ── Test configuration ────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 VUs over 30s
    { duration: '1m',  target: 50 },   // Hold at 50 VUs for 1 minute
    { duration: '30s', target: 100 },  // Spike to 100 VUs
    { duration: '1m',  target: 100 },  // Hold at 100 VUs
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95th percentile < 500ms
    http_req_failed:   ['rate<0.01'],  // < 1% error rate
    errors:            ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api/v1';

// ── Shared state ──────────────────────────────────────────────────────────────
let accessToken = '';

// ── Setup — runs once before all VUs ─────────────────────────────────────────
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'loadtest@ugskill.io', password: 'LoadTest@1234' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    console.warn(`Setup: login failed with status ${loginRes.status}`);
    return { token: '' };
  }

  const body = JSON.parse(loginRes.body as string);
  return { token: body.data?.accessToken ?? '' };
}

// ── Main scenario ─────────────────────────────────────────────────────────────
export default function main(data: { token: string }) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'health ok': (r) => r.status === 200 });
  errorRate.add(healthRes.status !== 200);
  sleep(0.5);

  // 2. List courses
  const coursesRes = http.get(`${BASE_URL}/courses?page=1&limit=10`, { headers });
  check(coursesRes, {
    'courses 200': (r) => r.status === 200,
    'courses fast': (r) => r.timings.duration < 300,
  });
  errorRate.add(coursesRes.status !== 200);
  sleep(1);

  // 3. List exams
  const examsRes = http.get(`${BASE_URL}/exams?page=1&limit=10`, { headers });
  check(examsRes, { 'exams 200': (r) => r.status === 200 });
  errorRate.add(examsRes.status !== 200);
  sleep(1);

  // 4. AI endpoint (throttled in prod — test rate limiter boundary)
  const aiRes = http.get(`${BASE_URL}/ai/sessions?page=1`, { headers });
  check(aiRes, { 'ai 200 or 429': (r) => r.status === 200 || r.status === 429 });
  sleep(2);
}
