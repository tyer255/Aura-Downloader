import puppeteer from 'puppeteer';

async function test() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://sssinstagram.com/', { waitUntil: 'domcontentloaded' });
    await page.type('#input', 'https://www.instagram.com/reel/DEZc6oSSg7E/');
    await page.click('.form__submit');
    
    let results: any[] = [];
    for (let i = 0; i < 15; i++) {
        results = await page.evaluate(() => {
            const res: any[] = [];
            const links = Array.from(document.querySelectorAll('a'));
            return links.map(a => a.href);
        });
        if (results.some(u => u.includes('sssinstagram'))) break;
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log(results);
    await browser.close();
}
test();
