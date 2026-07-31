async function run() {
    const instances = [
        "https://vid.puffyan.us",
        "https://inv.tux.pizza",
        "https://invidious.asir.dev"
    ];
    for (let inst of instances) {
        try {
            console.log("Trying", inst);
            const res = await fetch(`${inst}/api/v1/videos/dQw4w9WgXcQ`);
            if (res.ok) {
                const data = await res.json();
                console.log(inst, "Success!");
                const formats = data.formatStreams.map(f => ({ q: f.resolution, url: f.url }));
                console.log(formats.slice(0, 3));
                break;
            }
        } catch(e) {}
    }
}
run();
