import fs from 'fs';
import { execSync } from 'child_process';

const dest = './yt-dlp_linux';

if (!fs.existsSync(dest)) {
  console.log("Downloading yt-dlp_linux...");
  execSync("curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o ./yt-dlp_linux");
  execSync("chmod a+rx ./yt-dlp_linux");
  console.log("yt-dlp_linux downloaded and made executable.");
} else {
  console.log("yt-dlp_linux already exists.");
}
