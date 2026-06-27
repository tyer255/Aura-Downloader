import * as snapsave from 'snapsave-media-downloader';
async function test() {
    try {
        console.log("snapsave exports:", Object.keys(snapsave));
        if (snapsave.snapsave) {
            const res = await snapsave.snapsave('https://www.instagram.com/reel/DEZc6oSSg7E/');
            console.log("res1", JSON.stringify(res, null, 2));
        }
    } catch(e) {
        console.error(e);
    }
}
test();
