import instagramGetUrl from 'instagram-url-direct';
import ruhend from 'ruhend-scraper';

async function testAllPackages(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/`;
  console.log("==================================================");
  console.log("Testing packages for Instagram URL:", url);
  console.log("==================================================");

  // 1. instagram-url-direct
  try {
    console.log("\n--- Testing instagram-url-direct ---");
    const res1 = await instagramGetUrl(url);
    console.log("instagram-url-direct res:", res1 ? {
      results_number: res1.results_number,
      url_list_length: res1.url_list?.length,
      media_list_length: res1.media_list?.length
    } : null);
    if (res1?.url_list) {
      res1.url_list.forEach((u, i) => console.log(`  [Item ${i+1}]: ${u?.substring(0, 70)}`));
    }
  } catch(e) {
    console.log("instagram-url-direct error:", e.message);
  }

  // 2. ruhend-scraper
  try {
    console.log("\n--- Testing ruhend-scraper ---");
    if (ruhend && ruhend.igdl) {
      const res4 = await ruhend.igdl(url);
      console.log("ruhend res:", res4 ? { data_len: res4.data?.length } : null);
      if (res4?.data) {
        res4.data.forEach((item, i) => console.log(`  [Item ${i+1}]:`, item));
      }
    } else {
      console.log("ruhend.igdl not found");
    }
  } catch(e) {
    console.log("ruhend error:", e.message);
  }
}

async function main() {
  await testAllPackages("C3x-Z2_S0gY");
}

main();
