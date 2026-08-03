const SnapInsta = require('snapinsta');

async function test(url) {
  console.log("Testing SnapInsta.getLinks on:", url);
  try {
    const links = await SnapInsta.getLinks(url);
    console.log("SnapInsta Links count:", links?.length);
    console.log("SnapInsta Links:", JSON.stringify(links, null, 2));
  } catch (e) {
    console.log("SnapInsta Error:", e.message);
  }
}

async function run() {
  await test("https://www.instagram.com/p/DB1D7rwyF9H/");
  await test("https://www.instagram.com/p/C9hV0C6y_nZ/");
}

run();
