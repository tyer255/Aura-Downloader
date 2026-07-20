async function test() {
    const res = await fetch("https://api.cobalt.tools/api/json", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            aFormat: "best",
            vQuality: "max"
        })
    });
    const data = await res.json();
    console.log(data);
}
test();
