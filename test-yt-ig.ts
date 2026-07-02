import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

async function test() {
  const url = 'https://www.instagram.com/reel/C-R2sQhS9oH/';
  try {
    const { stdout } = await execPromise(`yt-dlp -j "${url}"`);
    console.log(stdout.substring(0, 300));
  } catch (e: any) {
    console.log(e.message);
  }
}
test();
