import { instagramGetUrl } from 'instagram-url-direct';
import { ultraigdl } from 'ultra-igdl';
import igdl from 'igdl.js';

async function testPkg3() {
  const url = "https://www.instagram.com/p/C3x-Z2_S0gY/";

  console.log("--- instagramGetUrl ---");
  try {
    const res = await instagramGetUrl(url);
    console.log("instagramGetUrl res:", res);
  } catch(e) { console.log("instagramGetUrl err:", e.message); }

  console.log("\n--- ultraigdl ---");
  try {
    const dl = new ultraigdl();
    const res = await dl.download(url);
    console.log("ultraigdl res:", res);
  } catch(e) { console.log("ultraigdl err:", e.message); }

  console.log("\n--- igdl.js ---");
  try {
    const res = await igdl(url);
    console.log("igdl.js res:", res);
  } catch(e) { console.log("igdl.js err:", e.message); }
}

testPkg3();
