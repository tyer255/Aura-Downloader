const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function run() {
    try {
      const { stdout } = await execAsync(`./yt-dlp_linux --js-runtimes node --no-playlist --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"`, { timeout: 25000 });
      const data = JSON.parse(stdout);
      console.log(data.formats.filter(f => f.vcodec !== 'none').map(f => `${f.format_id} - ${f.height}p - vcodec: ${f.vcodec}, acodec: ${f.acodec}`));
    } catch(e) { console.error("Error", e); }
}
run();
