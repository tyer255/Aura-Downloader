import { ytmp4 as vredenYtmp4 } from "@vreden/youtube_scraper";
async function test() {
    console.log(await vredenYtmp4("https://www.youtube.com/watch?v=jNQXAC9IVRw"));
}
test();
