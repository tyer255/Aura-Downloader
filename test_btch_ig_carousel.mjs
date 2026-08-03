import btch from 'btch-downloader';

async function test(url) {
  console.log("Testing btch-downloader on:", url);
  try {
    const res = await btch.igdl(url);
    console.log("Result status:", res?.status);
    console.log("Result length:", res?.result?.length);
    console.log("Result items:", JSON.stringify(res, null, 2).substring(0, 2000));
  } catch (e) {
    console.log("btch error:", e.message);
  }
}

async function run() {
  await test("https://www.instagram.com/p/DB1D7rwyF9H/");
  await test("https://www.instagram.com/p/C9hV0C6y_nZ/");
}

run();
