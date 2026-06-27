import { execSync } from 'child_process';
import path from 'path';
import puppeteer from 'puppeteer';

async function dump() {
    process.env.PUPPETEER_CACHE_DIR = path.join(process.cwd(), '.cache', 'puppeteer');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://sssinstagram.com/', { waitUntil: 'networkidle2' });
    await page.type('#input', 'https://instagram.com/p/C_q-O7xP8jE/');
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        page.click('.form__submit')
    ]);
    await new Promise(r => setTimeout(r, 5000));
    const results = await page.evaluate(() => document.body.innerHTML);
    console.log(results);
    await browser.close();
}
dump().catch(console.error);
