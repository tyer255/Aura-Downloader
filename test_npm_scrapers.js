import { ndown, ytdown, tikdown } from 'nayan-media-downloader';

async function testNayan() {
  const url = "https://www.instagram.com/p/C3x-Z2_S0gY/";
  console.log("Testing nayan-media-downloader for:", url);
  try {
    const res = await ndown(url);
    console.log("ndown result:", res);
  } catch(e) {
    console.log("ndown error:", e.message);
  }
}

testNayan();
