import insta from 'instagram-url-downloader';

async function test9() {
    try {
        const url = 'https://www.instagram.com/p/C_q-O7xP8jE/';
        const res = await (insta as any).default(url);
        console.log("insta:", JSON.stringify(res, null, 2));
    } catch(e: any) { console.error("insta error:", e.message) }
}
test9();
