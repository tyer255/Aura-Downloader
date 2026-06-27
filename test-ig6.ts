async function test() {
    try {
        const url = 'https://www.instagram.com/reel/DEZc6oSSg7E/';
        const res = await fetch(`https://api.vreden.web.id/api/ig?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        console.log("res:", JSON.stringify(json, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
