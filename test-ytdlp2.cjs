const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
async function run() {
  const url = "https://www.tiktok.com/@mrbeast/video/7387342686127328543";
  try {
     const { stdout, stderr } = await execAsync(`./yt-dlp_linux --no-playlist --dump-json "${url}"`, { timeout: 25000 });
     console.log(JSON.parse(stdout).title);
  } catch(e) {
     console.error(e.stderr);
  }
}
run();
