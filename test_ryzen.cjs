async function run() {
    try {
        const res = await fetch("https://api.ryzendesu.vip/api/downloader/ytmp4?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        const json = await res.json();
        console.log(json);
    } catch(e) { console.error(e.message) }
}
run();
