async function test() {
    const { default: b } = await import('@bochilteam/scraper');
    try {
        const r = await b.igdl('https://www.instagram.com/reel/C7X1kCDoZ7i/');
        console.log(r);
    } catch(e) { console.log(e.message); }
}
test();
