const fs = require('fs');
const html = fs.readFileSync('test_pin.html', 'utf8');

const regex = /"url":"(https:\/\/[^"]+\.(mp4|m3u8)[^"]*)"/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[1]);
}
