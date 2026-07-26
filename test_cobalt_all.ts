const instances = [
    "https://co.wuk.sh/api/json",
    "https://cobalt.q0.is/api/json",
    "https://api.cobalt.bckc.rs/api/json",
    "https://cobalt.kwiatekit.com/api/json",
    "https://cobalt.shiron.dev/api/json",
    "https://api.cobalt.tools/api/json",
    "https://api.ryzendesu.vip/api/downloader/igdl"
];
async function test() {
    for (let instance of instances) {
        try {
            console.log("Trying", instance);
            const res = await fetch(instance, {
                method: "POST",
                headers: { "Accept": "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ url: "https://www.youtube.com/watch?v=jNQXAC9IVRw" })
            });
            console.log(instance, res.status, await res.text());
        } catch(e) { console.error(instance, e.message); }
    }
}
test();
