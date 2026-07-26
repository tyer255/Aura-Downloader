async function test() {
    const urls = [
        "https://www.tiktok.com/@tiktok/video/7106594312292453675",
        "https://www.tiktok.com/@mrbeast/video/7303724395610262826"
    ];
    for (let u of urls) {
        try {
            const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(u)}`);
            const data = await res.json();
            console.log(u, data.data ? "success: " + (data.data.images ? "images" : "video") : "fail");
        } catch(e) { console.error(e.message) }
    }
}
test();
