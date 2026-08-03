import instagramGetUrl from 'instagram-url-direct';
import SnapInsta from 'snapinsta';

async function testSnapInsta(url) {
  console.log("Testing SnapInsta on:", url);
  try {
    const scraper = new SnapInsta();
    const res = await scraper.download(url);
    console.log("SnapInsta Result:", JSON.stringify(res, null, 2).substring(0, 1000));
  } catch (e) {
    console.log("SnapInsta Error:", e.message);
  }
}

async function testIgUrlDirect(url) {
  console.log("Testing instagram-url-direct on:", url);
  try {
    const res = await instagramGetUrl(url);
    console.log("IgUrlDirect Result:", JSON.stringify(res, null, 2).substring(0, 1000));
  } catch (e) {
    console.log("IgUrlDirect Error:", e.message);
  }
}

async function run() {
  const url = "https://www.instagram.com/p/DB1D7rwyF9H/";
  await testSnapInsta(url);
  await testIgUrlDirect(url);
}

run();
