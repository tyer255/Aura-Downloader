async function run() {
    const mod = await import('btch-downloader');
    console.log("mod:", Object.keys(mod));
    const b = mod.default || mod;
    console.log("b:", Object.keys(b));
    console.log("b.youtube is function?", typeof b.youtube === 'function');
    try {
        const res = await b.youtube("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        console.log(res);
    } catch(e) {
        console.error(e);
    }
}
run();
