import btch from 'btch-downloader';
async function test() {
  const url = 'https://www.instagram.com/reel/C-R2sQhS9oH/';
  const data = await btch.igdl(url);
  console.log(data);
}
test();
