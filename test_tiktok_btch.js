import btch from 'btch-downloader';
(async () => {
    try {
        console.log(await btch.ttdl('https://www.tiktok.com/@mrbeast/video/7239121959779355947'));
    } catch(e) {
        console.error(e);
    }
})();
