import youtubedl from 'youtube-dl-exec';
async function test() {
  const url = 'https://www.instagram.com/reel/C-R2sQhS9oH/';
  try {
    const data = await youtubedl(url, { dumpSingleJson: true });
    console.log(data);
  } catch (e: any) {
    console.log(e.message);
  }
}
test();
