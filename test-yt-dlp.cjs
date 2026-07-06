const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function run() {
    try {
      const { stdout } = await execAsync(`./yt-dlp_linux --js-runtimes node --no-playlist --dump-json "https://youtube.com/shorts/95DoDH-zPLo?si=gYJjGhk6fApS2qJE"`, { timeout: 25000 });
      const data = JSON.parse(stdout);
      console.log("Success");
    } catch(e) { console.error("Error", e); }
}
run();
