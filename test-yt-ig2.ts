import ytDlp from 'yt-dlp-exec';
async function test() {
  const url = 'https://www.instagram.com/reel/C-R2sQhS9oH/';
  try {
    const data = await ytDlp(url, { dumpJson: true });
    console.log(data);
  } catch (e: any) {
    console.log(e.message);
  }
}
test();
