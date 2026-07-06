const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function run() {
    try {
      const { stdout } = await execAsync(`./yt-dlp_linux --js-runtimes node --no-playlist --dump-json "https://www.instagram.com/p/C-hQ1u4A2L1"`, { timeout: 25000 });
      const data = JSON.parse(stdout);
      console.log(data.formats.filter(f => f.vcodec !== 'none').map(f => `${f.format_id} - ${f.height}p - vcodec: ${f.vcodec}, acodec: ${f.acodec}`));
    } catch(e) { console.error("Error", e); }
}
run();
