const http = require('http');

const urls = [
  // Pinterest
  "https://in.pinterest.com/pin/1033013233246726297/",
  // YouTube
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // video
  // Instagram
  "https://www.instagram.com/reel/C8qL_2vM1Jz/", // reel
  // TikTok
  "https://www.tiktok.com/@tiktok/video/7238210332851485994", 
  // Reddit
  "https://www.reddit.com/r/funny/comments/1eg0c54/he_is_having_the_time_of_his_life/"
];

async function testUrl(url) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ url });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/download',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 15000 // 15s timeout
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ url, success: json.success, title: json.title, mediaType: json.mediaType, error: json.message || json.error, qualities: json.qualities });
        } catch (e) {
          resolve({ url, success: false, error: 'Invalid JSON' });
        }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, success: false, error: 'Timeout' });
    });
    
    req.on('error', (e) => {
      resolve({ url, success: false, error: e.message });
    });
    
    req.write(data);
    req.end();
  });
}

async function run() {
  const promises = urls.map(async (url) => {
    const res = await testUrl(url);
    if (res.success) {
      console.log(`✅ Success | ${url} | Title: ${res.title}`);
      if (res.qualities) {
        console.log(`    Qualities: ${res.qualities.map(q => q.label).join(', ')}`);
      }
    } else {
      console.log(`❌ Failed  | ${url} | Error: ${res.error}`);
    }
  });
  await Promise.all(promises);
}

run();
