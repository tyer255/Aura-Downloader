import { ytmp4 } from '@vreden/youtube_scraper';

async function test() {
  const res = await ytmp4('https://www.youtube.com/watch?v=0PT5c1z3LL8', '1080p');
  console.log(JSON.stringify(res, null, 2));
}
test();
