import * as cheerio from 'cheerio';
async function test() {
  const url = 'https://www.instagram.com/reel/C89U8lSye0D/';
  try {
     const res = await fetch('https://corsproxy.io/?' + encodeURIComponent(url), {
       headers: {
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
       }
     });
     const html = await res.text();
     const $ = cheerio.load(html);
     console.log('Title:', $('title').text());
     console.log('og:title:', $('meta[property="og:title"]').attr('content'));
  } catch(e) { console.log(e.message); }
}
test();
