import * as igdlModule from 'instagram-url-direct';
async function test() {
    try {
        console.log(igdlModule);
        const res = await (igdlModule as any).instagramGetUrl('https://www.instagram.com/reel/DEZc6oSSg7E/');
        console.log("igdl res:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
