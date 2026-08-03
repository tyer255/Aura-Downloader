import youtubedl from 'youtube-dl-exec';

async function test(url) {
  console.log("Testing URL with yt-dlp:", url);
  try {
    const data = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      noCheckFormats: true
    });
    console.log("data._type:", data._type);
    console.log("data.id:", data.id);
    console.log("data.title:", data.title);
    if (data.entries) {
      console.log("Entries length:", data.entries.length);
      data.entries.forEach((e, i) => {
        console.log(`Entry #${i + 1}: id=${e.id}, title=${e.title}, url=${e.url?.substring(0, 50)}, thumbnail=${e.thumbnail?.substring(0, 50)}`);
      });
    } else {
      console.log("No entries. Single media.");
      console.log("url:", data.url?.substring(0, 80));
      console.log("thumbnail:", data.thumbnail?.substring(0, 80));
    }
  } catch (e) {
    console.log("yt-dlp error:", e.message);
  }
}

test("https://www.instagram.com/p/DB1D7rwyF9H/");
