import * as cheerio from "cheerio";
import fetch from "node-fetch";

async function test() {
  const url = "https://www.instagram.com/p/DBk3aIay2jQ/";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const ogImage = $('meta[property="og:image"]').attr('content');
  console.log("og:image =", ogImage);
}
test();
