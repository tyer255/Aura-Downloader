import igDl from 'instagram-url-downloader';

async function test() {
    try {
        const client = new igDl.default(); // wait, no
        const res = await igDl.downloader('https://www.instagram.com/reel/DEZc6oSSg7E/');
        console.log("igDl res:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("igDl error", e);
    }
}
test();
