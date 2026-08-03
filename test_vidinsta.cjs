const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

async function testVidinsta(url) {
  console.log("Testing Vidinsta on:", url);
  try {
    const pageRes = await axios.get("https://vidinsta.app/");
    const $page = cheerio.load(pageRes.data);
    const csrfToken = $page('meta[name="csrf-token"]').attr('content') || $page('input[name="_csrf"]').val();
    const cookies = pageRes.headers['set-cookie'] ? pageRes.headers['set-cookie'].join('; ') : '';
    console.log("CSRF Token:", csrfToken);

    const postRes = await axios.post("https://vidinsta.app/web/home/fetch", qs.stringify({ url: url }), {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "origin": "https://vidinsta.app",
        "referer": "https://vidinsta.app/",
        "x-csrf-token": csrfToken,
        "x-requested-with": "XMLHttpRequest",
        "cookie": cookies
      }
    });

    console.log("Post status:", postRes.status);
    const $ = cheerio.load(postRes.data);
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('download') || href.includes('cdn') || href.includes('http'))) {
        links.push({ text: $(el).text().trim(), href });
      }
    });
    console.log("Links found:", links);
    console.log("Response data substring:", postRes.data.substring(0, 500));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

testVidinsta("https://www.instagram.com/p/DB1D7rwyF9H/");
