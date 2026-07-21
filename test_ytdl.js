import ytdl from "@distube/ytdl-core";

async function test() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick Astley
  console.log("Testing @distube/ytdl-core with URL:", url);
  const start = Date.now();
  try {
    const info = await ytdl.getInfo(url);
    console.log("ytdl-core success in", (Date.now() - start) / 1000, "seconds");
    console.log("Title:", info.videoDetails.title);
    console.log("Length (sec):", info.videoDetails.lengthSeconds);
    const formats = info.formats;
    console.log("Found formats:", formats.length);
  } catch (err) {
    console.error("ytdl-core error after", (Date.now() - start) / 1000, "seconds:", err.message);
  }
}

test();
