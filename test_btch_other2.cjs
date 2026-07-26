const btch = require('btch-downloader');
(async () => {
    try {
        console.log("TikTok:", await btch.ttdl('https://www.tiktok.com/@mrbeast/video/7239121959779355947'));
    } catch(e) {}
    try {
        console.log("Facebook:", await btch.fbdown('https://www.facebook.com/reel/1077708513524671'));
    } catch(e) {}
    try {
        console.log("AIO:", await btch.aio('https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYcmRweGF1YmttAY2F5xXoAY2F5w_GAAAAAA'));
    } catch(e) {}
})();
