const cheerio = require("cheerio");
const fs = require("fs");
async function run() {
   const html = await (await fetch("https://www.instagram.com/p/C-hQ1u4A2L1/embed/")).text();
   const $ = cheerio.load(html);
   
   const scriptTags = $('script').map((i, el) => $(el).html()).get();
   const mediaUrl = scriptTags.find(s => s.includes('video_url')) || scriptTags.find(s => s.includes('.mp4'));
   if (mediaUrl) {
      const match = mediaUrl.match(/"video_url":"([^"]+)"/);
      console.log(match ? match[1].replace(/\\u0026/g, '&') : "Found script but no video_url");
   } else {
      console.log("No video URL found in scripts");
   }
}
run();
