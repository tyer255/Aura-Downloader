async function test() {
    try {
        const vreden = await import('@vreden/youtube_scraper');
        console.log("vreden:", Object.keys(vreden));
    } catch(e) {
        console.error(e);
    }
}
test();
