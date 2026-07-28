const https = require('https');
https.get('https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
