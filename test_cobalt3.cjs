async function test() {
    const instances = [
    "https://co.wuk.sh/api/json",
    "https://cobalt.q0.is/api/json",
    "https://api.cobalt.bckc.rs/api/json",
    "https://cobalt.kwiatekit.com/api/json",
    "https://cobalt.shiron.dev/api/json"
    ];
    for (const inst of instances) {
        try {
            console.log("Trying", inst);
            const res = await fetch(inst, {
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
            const text = await res.text();
            console.log(inst, res.status, text);
        } catch(e) {
            console.error(inst, "failed", e.message);
        }
    }
}
test();
