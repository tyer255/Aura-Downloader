import { snapsave } from '@bochilteam/scraper-snapsave';

async function testSnapsavePkg() {
  const shortcodes = ["C3x-Z2_S0gY", "C1_x_1RSo8_"];
  for (const sc of shortcodes) {
    const url = `https://www.instagram.com/p/${sc}/`;
    console.log("\nTesting @bochilteam/scraper-snapsave for:", url);
    try {
      const res = await snapsave(url);
      console.log("snapsave count:", res?.length);
      if (res) {
        res.forEach((item, i) => console.log(`  [Item ${i+1}] url: ${item.url?.substring(0, 70)}`));
      }
    } catch(e) {
      console.log("snapsave error:", e.message);
    }
  }
}

testSnapsavePkg();
