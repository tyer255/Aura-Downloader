async function test() {
    try {
        const res = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                url: 'https://www.instagram.com/reel/DEZc6oSSg7E/',
            })
        });
        const data = await res.json();
        console.log("res:", JSON.stringify(data, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
