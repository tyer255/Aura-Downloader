import instagramGetUrl from 'instagram-url-direct';
async function test() {
    try {
        const res = await instagramGetUrl.instagramGetUrl('https://www.instagram.com/p/DF1Q3bWp7Tj/');
        console.log("igdl res:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
