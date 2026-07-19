import fs from 'fs';
export async function test() {
    const url = "https://www.pinterest.com/pin/341851427956802746/";
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    const html = await res.text();
    fs.writeFileSync('pin3.html', html);
    console.log("Written pin3.html, size:", html.length);
}
test();
