import { launch } from 'puppeteer';

async function test() {
    const browser = await launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
        headless: true
    });
    const page = await browser.newPage();
    await page.goto('https://sssinstagram.com/', { waitUntil: 'networkidle2' });
    await page.type('input[id="main_page_text"]', 'https://www.instagram.com/reel/DEZc6oSSg7E/');
    await page.click('button[id="submit"]');
    
    await new Promise(r => setTimeout(r, 6000)); // wait for result
    
    const html = await page.content();
    console.log(html.substring(0, 1000));
    console.log("has result?", html.includes("result"));
    console.log("body html snippet:", await page.evaluate(() => document.body.innerText.substring(0, 500)));
    
    await browser.close();
}
test().catch(console.error);
