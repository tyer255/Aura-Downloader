import ytdl from "@distube/ytdl-core";
async function test() {
    console.log("ytdl testing...");
    try {
        let startTime = Date.now();
        const info = await ytdl.getInfo("https://www.youtube.com/watch?v=jNQXAC9IVRw");
        console.log("ytdl core done in", Date.now() - startTime, "ms", !!info);
    } catch(e) { console.error("ytdl err:", e.message) }
}
test();
