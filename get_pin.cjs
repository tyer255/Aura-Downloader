const fs = require('fs');
async function run() {
  const url = "https://www.pinterest.com/pin/28851253859769811/";
  const res = await fetch(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/<script data-relay-response="[^"]+" type="application\/json">([\s\S]*?)<\/script>/g);
  if (match) {
      console.log("Found " + match.length + " relay responses");
      for (const m of match) {
          const jsonMatch = m.match(/<script[^>]*>([\s\S]*?)<\/script>/);
          if (jsonMatch) {
              const data = JSON.parse(jsonMatch[1]);
              fs.appendFileSync('relay_data.jsonl', JSON.stringify(data) + "\n");
          }
      }
  } else {
      console.log("No relay responses found");
  }
}
run();
