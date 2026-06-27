async function test() {
    try {
        const res = await fetch('https://co.wuk.sh/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
                vQuality: '1080'
            })
        });
        console.log(res.status, await res.text());
    } catch(e) {
        console.error(e);
    }
}
test();
