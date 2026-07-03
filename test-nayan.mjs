import { ndown } from 'nayan-media-downloader';
async function test() {
  const url = 'https://www.instagram.com/reel/C89U8lSye0D/';
  try {
     const res = await ndown(url);
     console.log(JSON.stringify(res, null, 2));
  } catch(e) { console.log('err:', e.message); }
}
test();
