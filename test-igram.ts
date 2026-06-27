async function test() {
    try {
        const url = 'https://www.instagram.com/reel/DEZc6oSSg7E/';
        const res = await fetch('https://igram.world/api/ig/userInfoByUrl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0'
            },
            body: new URLSearchParams({ url }).toString()
        });
        console.log(await res.text());
    } catch(e) {
        console.error(e);
    }
}
test();
