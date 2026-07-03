import * as cheerio from 'cheerio';
async function test() {
  const embedUrl = 'https://www.instagram.com/p/C89U8lSye0D/embed/';
  const res = await fetch(embedUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log('Title:', $('title').text());
}
test();
