async function run() {
    try {
        const instancesRes = await fetch("https://cobalt.tools/instances.json");
        const instances = await instancesRes.json();
        console.log("Found", instances.length, "instances");
    } catch(e) {
        console.error("Failed to get instances:", e.message);
    }
}
run();
