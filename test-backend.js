const https = require('https');
const http = require('http');
const fs = require('fs');

// Test if the deployed backend is accessible
const testDeployedBackend = () => {
  console.log('Testing deployed backend: https://clean-cloak-b.onrender.com');
  
  const url = new URL('https://clean-cloak-b.onrender.com/api/health');
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Node.js test client'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('Response:', json);
        console.log('✅ Deployed backend is accessible');
      } catch (e) {
        console.log('Response (non-JSON):', data);
        console.log('⚠️ Deployed backend responded but with non-JSON data');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error connecting to deployed backend:', e.message);
    console.log('💡 This could mean the deployed backend is down or not accessible');
  });

  req.end();
};

// Test if local backend is accessible
const testLocalBackend = () => {
  console.log('\nTesting local backend: http://localhost:5000');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Node.js test client'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('Response:', json);
        console.log('✅ Local backend is accessible');
      } catch (e) {
        console.log('Response (non-JSON):', data);
        console.log('⚠️ Local backend responded but with non-JSON data');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error connecting to local backend:', e.message);
    console.log('💡 Make sure you have started your local backend server with: npm run start');
  });

  req.end();
};

// Run tests
testDeployedBackend();
setTimeout(testLocalBackend, 2000); // Wait 2 seconds between tests