const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/api/db-check');
    const data = await response.json();
    console.log('Endpoint test result:', data);
  } catch (error) {
    console.error('Endpoint test failed:', error.message);
  }
}

testEndpoint();
