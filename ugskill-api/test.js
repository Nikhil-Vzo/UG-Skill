const axios = require('axios');

async function run() {
  try {
    // Assuming the user is running the API on port 3000 or 5000
    // But we need a token. 
    // Just hitting a non-existent endpoint to verify logging works?
    console.log('Script running');
  } catch (err) {
    console.error(err);
  }
}
run();
