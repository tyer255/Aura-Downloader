const http = require('http');
const url = "https://in.pinterest.com/pin/1033013233246726297/";

const data = JSON.stringify({ url });
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/download',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(JSON.parse(body));
  });
});

req.write(data);
req.end();
