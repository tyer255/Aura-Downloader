import { ytmp4 } from "@vreden/youtube_scraper";

async function test() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick Astley
  console.log("Testing vredenYtmp4 with URL:", url);
  const start = Date.now();
  try {
    const res = await ytmp4(url);
    console.log("vredenYtmp4 success in", (Date.now() - start) / 1000, "seconds");
    console.log("Result keys:", Object.keys(res || {}));
    if (res && res.download) {
      console.log("Download keys:", Object.keys(res.download));
      console.log("Download details:", res.download);
    }
  } catch (err) {
    console.error("vredenYtmp4 error after", (Date.now() - start) / 1000, "seconds:", err.message);
  }
}

test();
