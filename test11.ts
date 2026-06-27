import instagramDl from 'instagram-dl';

async function test11() {
    try {
        const url = 'https://www.instagram.com/p/C_q-O7xP8jE/';
        const res = await instagramDl(url);
        console.log("instagram-dl:", JSON.stringify(res, null, 2));
    } catch(e: any) { console.error("instagram-dl error:", e.message) }
}
test11();
