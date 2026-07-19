const http = require('http');
const req = http.request('http://localhost:3000/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
req.write(JSON.stringify({ url: "https://x.com/SpaceX" }));
req.end();
