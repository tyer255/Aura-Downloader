import btch from 'btch-downloader';
async function test() {
    try {
        console.log("TikTok:", await btch.ttdl('https://www.tiktok.com/@mrbeast/video/7239121959779355947'));
    } catch(e) { console.error("TikTok err:", e.message) }
    try {
        console.log("Facebook:", await btch.fbdown('https://www.facebook.com/reel/1077708513524671'));
    } catch(e) { console.error("Facebook err:", e.message) }
    try {
        console.log("Snapchat (AIO):", await btch.aio('https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYcmRweGF1YmttAY2F5xXoAY2F5w_GAAAAAA'));
    } catch(e) { console.error("Snapchat err:", e.message) }
}
test();
