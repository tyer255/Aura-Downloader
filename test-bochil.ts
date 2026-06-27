import { instagramdl } from '@bochilteam/scraper-instagram';
async function test() {
    try {
        const res = await instagramdl('https://www.instagram.com/reel/DEZc6oSSg7E/');
        console.log(res);
    } catch(e) {
        console.error(e);
    }
}
test();
