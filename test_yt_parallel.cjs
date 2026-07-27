const YouTube = require('youtube-sr').default;

async function test() {
    const queries = [
        "Shape of you Ed Sheeran audio",
        "Perfect Ed Sheeran audio",
        "Photograph Ed Sheeran audio",
        "Thinking out loud Ed Sheeran audio",
        "Galway girl Ed Sheeran audio",
        "Castle on the hill Ed Sheeran audio",
        "Happier Ed Sheeran audio",
        "Dive Ed Sheeran audio",
        "Tenerife sea Ed Sheeran audio",
        "I see fire Ed Sheeran audio"
    ];
    console.time("ParallelSearch");
    const results = await Promise.all(queries.map(q => YouTube.searchOne(q)));
    console.timeEnd("ParallelSearch");
    results.forEach((r, i) => {
        console.log(queries[i], "=>", r.id);
    });
}
test();
