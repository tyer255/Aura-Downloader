async function run() {
    try {
        const res = await fetch("https://raw.githubusercontent.com/wukko/cobalt/current/instances.json");
        console.log(res.status);
    } catch(e) {}
}
run();
