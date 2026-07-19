const https = require('https');
const url = 'https://v1.pinimg.com/videos/iht/hls/be/c2/f1/bec2f1249c02808704c5b68d82e3ae64_720w.m3u8';
const req = https.request(url, { method: 'HEAD', timeout: 3000 }, (res) => {
    console.log("Status:", res.statusCode);
    console.log("Headers:", res.headers);
});
req.on('error', e => console.error(e));
req.end();
