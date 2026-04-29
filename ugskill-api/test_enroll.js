const http = require('http');

const data = JSON.stringify({
  enrollableType: 'course',
  enrollableId: '69f2659e63149b2e7fd65b9a',
  source: 'self'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/lms/enrollments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer test' // dummy token
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
