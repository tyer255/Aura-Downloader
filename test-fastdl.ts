async function test() {
    try {
        const url = 'https://www.instagram.com/reel/DEZc6oSSg7E/';
        const res = await fetch('https://snapinsta.app/action.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0'
            },
            body: new URLSearchParams({ url: url, action: 'post' }).toString()
        });
        const data = await res.text();
        console.log("fastdl:", data.substring(0, 500));
    } catch(e) {
        console.error(e);
    }
}
test();
