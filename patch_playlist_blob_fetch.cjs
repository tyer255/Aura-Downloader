const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content
  .replace(/const response = await fetch\(streamUrl\);/g, 'const response = await fetchWithTimeoutAndRetry(streamUrl, {}, 60000, 2);')
  .replace(/const res1 = await fetch\(item\.url\);/g, 'const res1 = await fetchWithTimeoutAndRetry(item.url, {}, 60000, 2);')
  .replace(/const res2 = await fetch\(json\.url\);/g, 'const res2 = await fetchWithTimeoutAndRetry(json.url, {}, 60000, 2);')
  .replace(/const res = await fetch\(item\.url\);/g, 'const res = await fetchWithTimeoutAndRetry(item.url, {}, 60000, 2);')
  .replace(/const res2 = await fetch\(downloadUrl\);/g, 'const res2 = await fetchWithTimeoutAndRetry(downloadUrl, {}, 60000, 2);');

fs.writeFileSync('src/App.tsx', content);
