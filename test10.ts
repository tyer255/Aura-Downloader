import insta from 'instagram-url-downloader';

async function test10() {
    try {
        const url = 'https://instagram.com/p/C_q-O7xP8jE/';
        const Downloader = (insta as any).default || insta;
        const instance = new Downloader();
        console.log(Object.keys(instance));
    } catch(e: any) { console.error("insta error:", e.message) }
}
test10();
