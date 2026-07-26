async function test() {
    const urls = [
        "https://api.ryzendesu.vip/api/downloader/tiktok?url=https://www.tiktok.com/@mrbeast/video/7239121959779355947",
        "https://api.ryzendesu.vip/api/downloader/ytmp4?url=https://www.youtube.com/watch?v=jNQXAC9IVRw",
        "https://api.ryzendesu.vip/api/downloader/fbdl?url=https://www.facebook.com/reel/1077708513524671"
    ];
    for (let u of urls) {
        try {
            const res = await fetch(u);
            const data = await res.json();
            console.log(u.split('downloader/')[1].split('?')[0], !!data);
        } catch(e) { console.error(e.message) }
    }
}
test();
