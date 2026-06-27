import igdl from '@sasmeee/igdl';
async function test() {
    try {
        const res = await igdl('https://www.instagram.com/reel/DEZc6oSSg7E/');
        console.log("igdl res:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
