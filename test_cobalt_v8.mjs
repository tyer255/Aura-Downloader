async function run() {
    const res = await fetch("https://api.cobalt.tools/", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "AuraDownloader/1.0"
        },
        body: JSON.stringify({
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        })
    });
    console.log(res.status);
    console.log(await res.text());
}
run();
