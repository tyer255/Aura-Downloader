const btch = require('btch-downloader');
(async () => {
    try {
        console.log("Snapchat:", await btch.snapchat('https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYcmRweGF1YmttAY2F5xXoAY2F5w_GAAAAAA'));
        console.log("TikTok:", await btch.ttdl('https://www.tiktok.com/@mrbeast/video/7239121959779355947'));
        console.log("Facebook:", await btch.fbdown('https://www.facebook.com/reel/1077708513524671'));
    } catch(e) {
        console.error(e);
    }
})();
