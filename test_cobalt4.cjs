async function test() {
    const instances = [
    "https://cobalt.api.sbe.wtf/api/json",
    "https://api.cobalt.tools/api/json",
    "https://cobalt.kwiatekit.com/api/json",
    "https://co.wuk.sh/api/json"
    ];
    for (const inst of instances) {
        try {
            console.log("Trying", inst);
            const res = await fetch(inst, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
                },
                body: JSON.stringify({
                    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                })
            });
            const text = await res.text();
            console.log(inst, res.status, text.substring(0, 200));
        } catch(e) {
            console.error(inst, "failed", e.message);
        }
    }
}
test();
