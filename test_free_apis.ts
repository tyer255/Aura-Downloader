async function test() {
    const urls = [
        "https://www.tikwm.com/api/?url=https://www.tiktok.com/@mrbeast/video/7239121959779355947"
    ];
    for (let u of urls) {
        try {
            const res = await fetch(u);
            const data = await res.json();
            console.log(u.split('?url=')[1], !!data.data);
        } catch(e) { console.error(e.message) }
    }
}
test();
