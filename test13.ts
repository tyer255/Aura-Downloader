import { execSync } from 'child_process';
try {
    const out = execSync('PUPPETEER_CACHE_DIR=$(pwd)/.cache/puppeteer npx puppeteer browsers install chrome', { encoding: 'utf8' });
    console.log(out);
} catch (e: any) {
    console.error("error:", e.message);
    if (e.stdout) console.log("stdout:", e.stdout.toString());
    if (e.stderr) console.error("stderr:", e.stderr.toString());
}
