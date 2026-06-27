import * as snapsave from 'snapsave-media-downloader';
import { igdown } from 'igdown-scrapper';

async function test2() {
    try {
        const url = 'https://www.instagram.com/p/C_q-O7xP8jE/';
        const res = await snapsave.igdl(url);
        console.log("snapsave:", JSON.stringify(res, null, 2));
    } catch(e: any) { console.error("snapsave error:", e.message) }
    
    try {
        const url = 'https://www.instagram.com/p/C_q-O7xP8jE/';
        const res = await igdown(url);
        console.log("igdown-scrapper:", JSON.stringify(res, null, 2));
    } catch(e: any) { console.error("igdown-scrapper error:", e.message) }
}
test2();
