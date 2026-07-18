import { pinterest } from 'btch-downloader';

async function testPin() {
  try {
    const data = await pinterest("video clips");
    const arr = data.result.result.result;
    for (const p of arr) {
        if (p.video_url || p.videos) {
            console.log("Found video!", p.pin_url);
            console.log(p.video_url || p.videos);
            break;
        }
    }
  } catch (e) {
    console.error(e);
  }
}
testPin();
