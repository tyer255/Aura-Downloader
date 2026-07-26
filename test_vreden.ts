import { ytmp4 as vredenYtmp4 } from "@vreden/youtube_scraper";
async function test() {
    console.log("Vreden testing...");
    try {
        const res = await vredenYtmp4("https://www.youtube.com/watch?v=jNQXAC9IVRw");
        console.log("Vreden:", res.status);
    } catch(e) { console.error("Vreden err:", e.message) }
}
test();
