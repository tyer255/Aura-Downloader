import btch from 'btch-downloader';
async function test() {
    try {
        console.log("YouTube:", await btch.youtube('https://www.youtube.com/watch?v=jNQXAC9IVRw'));
    } catch(e) { console.error("YouTube err:", e.message) }
}
test();
