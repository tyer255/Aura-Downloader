async function testAPI() {
    try {
        const res = await fetch('http://localhost:3000/api/ig-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://instagram.com/p/C_q-O7xP8jE/' })
        });
        const data = await res.json();
        console.log("API response:", JSON.stringify(data, null, 2));
    } catch(e: any) {
        console.error("API error:", e.message);
    }
}
testAPI();
