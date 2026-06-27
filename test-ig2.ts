import instagramGetUrl from 'instagram-url-direct';
async function test() {
    try {
        const res = await instagramGetUrl.instagramGetUrl('https://www.instagram.com/reel/DEZc6oSSg7E/');
        console.log("igdl res:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
