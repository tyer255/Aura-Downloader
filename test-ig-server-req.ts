async function test() {
    try {
        console.log("Sending request to port 3000...");
        const res = await fetch('http://localhost:3000/api/ig-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://www.instagram.com/reel/DEZc6oSSg7E/' })
        });
        const data = await res.json();
        console.log("ig media result:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
