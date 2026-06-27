import * as snapsave from 'snapsave-media-downloader';

async function test5() {
    try {
        const url = 'https://www.instagram.com/p/C_q-O7xP8jE/';
        const res = await snapsave.snapsave(url);
        console.log("snapsave:", JSON.stringify(res, null, 2));
    } catch(e: any) { console.error("snapsave error:", e.message) }
}
test5();
