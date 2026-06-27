import btch from 'btch-downloader';
async function test() {
    try {
        console.log("btch exports:", Object.keys(btch));
        if (btch.igdl) {
            const res = await btch.igdl('https://www.instagram.com/reel/DEZc6oSSg7E/');
            console.log("igdl res:", JSON.stringify(res, null, 2));
        }
    } catch(e) {
        console.error(e);
    }
}
test();
