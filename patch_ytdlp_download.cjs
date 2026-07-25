const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const downloadScript = `
async function ensureYtDlp() {
  const ytdlpPath = path.join(process.cwd(), 'yt-dlp');
  const binDir = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin');
  const nodeModulesYtdlp = path.join(binDir, 'yt-dlp');
  
  try {
    fs.mkdirSync(binDir, { recursive: true });
    
    // Download fresh if not exists or if size is suspiciously small/corrupt
    let needDownload = true;
    if (fs.existsSync(nodeModulesYtdlp)) {
       const stats = fs.statSync(nodeModulesYtdlp);
       if (stats.size > 2000000) {
           needDownload = false; // looks okay
       }
    }
    
    if (needDownload) {
       console.log("Downloading yt-dlp binary...");
       const { execSync } = require('child_process');
       execSync('curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ' + nodeModulesYtdlp);
       execSync('chmod a+rx ' + nodeModulesYtdlp);
       console.log("yt-dlp downloaded.");
    }
  } catch (e) {
    console.error("Failed to ensure yt-dlp:", e);
  }
}
ensureYtDlp();
`;

code = code.replace(/async function startServer\(\) \{/, downloadScript + '\nasync function startServer() {');

fs.writeFileSync('server.ts', code);
