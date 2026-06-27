import { instagramdl } from '@bochilteam/scraper-instagram';

async function test6() {
    try {
        const url = 'https://www.instagram.com/p/C_q-O7xP8jE/';
        const res = await instagramdl(url);
        console.log("bochilteam:", JSON.stringify(res, null, 2));
    } catch(e: any) { console.error("bochilteam error:", e.message) }
}
test6();
