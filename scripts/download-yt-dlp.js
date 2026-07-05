import fs from 'fs';
import { execSync } from 'child_process';

const dest = './yt-dlp';
if (!fs.existsSync(dest)) {
  console.log("Downloading yt-dlp...");
  execSync("curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./yt-dlp");
  execSync("chmod a+rx ./yt-dlp");
  console.log("yt-dlp downloaded and made executable.");
} else {
  console.log("yt-dlp already exists.");
}
