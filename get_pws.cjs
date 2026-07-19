const fs = require('fs');
async function run() {
  const url = "https://www.pinterest.com/pin/28851253859769811/";
  const res = await fetch(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/<script id="__PWS_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    fs.writeFileSync('pws_data.json', JSON.stringify(data.props?.initialReduxState?.pins || data, null, 2));
    console.log("Written!");
  }
}
run();
