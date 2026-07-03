import * as cheerio from 'cheerio';
async function test() {
  const url = 'https://www.instagram.com/reel/C89U8lSye0D/';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log('og:image:', $('meta[property="og:image"]').attr('content'));
  console.log('og:title:', $('meta[property="og:title"]').attr('content'));
  
  // also check if any display_url is in the html
  const displayUrlMatch = html.match(/"display_url":"([^"]+)"/);
  if (displayUrlMatch) console.log('display_url:', displayUrlMatch[1]);
}
test();
