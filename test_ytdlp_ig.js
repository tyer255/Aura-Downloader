import youtubedl from 'youtube-dl-exec';

async function testYtdlpIG(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/`;
  console.log("Testing youtube-dl-exec for Instagram Carousel:", url);

  try {
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    });

    console.log("yt-dlp title:", output.title);
    console.log("yt-dlp _type:", output._type);
    console.log("yt-dlp extractor:", output.extractor);
    if (output.entries) {
      console.log(`yt-dlp ENTRIES COUNT (Carousel items): ${output.entries.length}`);
      output.entries.forEach((e, i) => {
        console.log(`  [Item ${i+1}] title: ${e.title}, url: ${e.url?.substring(0, 60)}..., ext: ${e.ext}`);
      });
    } else {
      console.log("yt-dlp single item url:", output.url?.substring(0, 60));
    }
  } catch(e) {
    console.log("yt-dlp error:", e.message);
  }
}

async function main() {
  await testYtdlpIG("C3x-Z2_S0gY");
}

main();
