import igdown from 'igdown-scrapper';
async function test() {
    try {
        console.log(igdown);
        const res = await igdown('https://www.instagram.com/reel/DEZc6oSSg7E/');
        console.log("res:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
