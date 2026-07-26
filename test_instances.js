async function run() {
    try {
        const res = await fetch("https://cobalt-instances.duti.tech/api/instances");
        const json = await res.json();
        console.log(json.filter(x => x.score > 90).map(x => x.api).slice(0, 10));
    } catch(e) { console.error(e) }
}
run();
