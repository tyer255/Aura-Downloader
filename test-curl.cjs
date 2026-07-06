const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/download',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify({
        success: parsed.success,
        title: parsed.title,
        qualities: parsed.qualities
      }, null, 2));
    } catch(e) {
      console.log("Not JSON:", data);
    }
  });
});

req.write(JSON.stringify({ url: "https://youtube.com/shorts/95DoDH-zPLo?si=gYJjGhk6fApS2qJE" }));
req.end();
