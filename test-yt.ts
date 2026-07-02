import { ytmp4 } from '@vreden/youtube_scraper';
import btch from 'btch-downloader';

async function test() {
  const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  console.log("Testing vreden...");
  try {
    const res = await ytmp4(url, '720p');
    console.log("Vreden:", res);
  } catch(e) { console.error("Vreden err", e.message); }

  console.log("Testing btch...");
  try {
    const res2 = await btch.youtube(url);
    console.log("Btch:", res2);
  } catch(e) { console.error("Btch err", e.message); }
}
test();
