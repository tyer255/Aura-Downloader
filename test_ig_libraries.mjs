import instagramGetUrl from 'instagram-url-direct';
import { instagram } from '@bochilteam/scraper-instagram';
import { snapsave } from '@bochilteam/scraper-snapsave';
import { igdl } from 'ruhend-scraper';

const testUrls = [
  "https://www.instagram.com/p/C9hV0C6y_nZ/",
  "https://www.instagram.com/p/DB1D7rwyF9H/"
];

async function testLib(name, fn) {
  console.log(`\n=== Testing ${name} ===`);
  for (const url of testUrls) {
    try {
      console.log(`URL: ${url}`);
      const res = await fn(url);
      console.log("RESULT:", JSON.stringify(res, null, 2).substring(0, 500));
    } catch (e) {
      console.log("ERROR:", e.message);
    }
  }
}

async function run() {
  await testLib("instagram-url-direct", (url) => instagramGetUrl(url));
  await testLib("@bochilteam/scraper-instagram", (url) => instagram(url));
  await testLib("@bochilteam/scraper-snapsave", (url) => snapsave(url));
  await testLib("ruhend-scraper igdl", (url) => igdl(url));
}

run();
