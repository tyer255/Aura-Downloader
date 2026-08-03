import instagramGetUrl from 'instagram-url-direct';

async function run() {
  console.log("=== Testing instagram-url-direct ===");
  try {
    const res = await instagramGetUrl("https://www.instagram.com/p/DB1D7rwyF9H/");
    console.log("instagram-url-direct res:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.log("instagram-url-direct error:", e.message);
  }
}

run();
