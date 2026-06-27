async function testCobalt() {
    try {
        const url = 'https://www.instagram.com/p/C_q-O7xP8jE/';
        const res = await fetch('https://cobalt-api.kwiatekm.workers.dev/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });
        const data = await res.json();
        console.log("cobalt:", JSON.stringify(data, null, 2));
    } catch(e: any) { console.error("cobalt error:", e.message) }
}
testCobalt();
