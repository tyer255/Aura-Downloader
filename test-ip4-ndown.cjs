const http = require('http');
const https = require('https');
const { URL } = require('url');

async function fetchIPv4(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(urlStr, { ...options, family: 4 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  try {
     const fd = new URLSearchParams();
     fd.append("url", "https://www.instagram.com/p/C9Hh90OyzNq/");
     
     const res = await fetchIPv4("https://ndown.pro/api/videodownloader", {
       method: 'POST',
       headers: {
         'User-Agent': 'Mozilla/5.0',
         'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
         'Accept': 'application/json'
       },
       body: fd.toString()
     });
     console.log(res.status);
     console.log(res.data.substring(0, 1000));
  } catch(e) { console.log(e); }
}
run();
