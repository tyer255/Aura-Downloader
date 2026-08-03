const fs = require('fs');
const text = fs.readFileSync('test_extract.json', 'utf8');
try {
  const json = JSON.parse(text);
  console.log("Success:", json.success);
  console.log("Message:", json.message);
  console.log("Media count:", json.media ? json.media.length : 0);
  console.log("Source:", json.source);
  if (json.media) {
    json.media.forEach((m, i) => {
      console.log(`[${i}] ID: ${m.id} URL: ${m.url?.substring(0, 80)}`);
    });
  }
} catch(e) {
  console.log("Parse error:", e.message);
  console.log(text.substring(0, 200));
}
