const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `async function extractInstagramBtch(url: string) {
  console.log("Trying btch-downloader for Instagram...");
  try {
    const b = await getBtch();
    const r = await b.igdl(url);
    if (r && r.status && r.result && Array.isArray(r.result) && r.result.length > 0) {
      const carouselItems = extractCarouselItemsFromNode({ carousel_media: r.result });
      if (carouselItems.length > 0) {
        return {
          success: true,
          title: carouselItems.length > 1 ? "Instagram Carousel" : (carouselItems[0].type === "video" ? "Instagram Reel" : "Instagram Post"),
          thumbnail: carouselItems[0].thumbnail,
          url: carouselItems[0].url,
          mediaType: carouselItems.length > 1 ? "carousel" : carouselItems[0].type,
          media: carouselItems,
          source: "btch"
        };
      }
    }
  } catch (e) {
    // silently ignore btch-downloader errors
  }
  return null;
}`;

const replacement = `async function extractInstagramBtch(url: string) {
  console.log("Trying btch-downloader for Instagram...");
  try {
    const b = await getBtch();
    const r = await b.igdl(url);
    if (r && r.status && r.result && Array.isArray(r.result) && r.result.length > 0) {
      const items: any[] = r.result;
      const media = items.map((item: any) => {
        const type = inferInstagramType(item, url);
        return { type, url: item.url, thumbnail: item.thumbnail || item.url };
      });
      const primary = media[0];
      const qualities = primary.type === "video"
        ? getFallbackQualities(primary.url, "video")
        : undefined;

      return {
        success: true,
        title: media.length > 1 ? "Instagram Carousel" : (primary.type === "video" ? "Instagram Reel" : "Instagram Post"),
        thumbnail: primary.thumbnail,
        url: primary.url,
        mediaType: media.length > 1 ? "carousel" : primary.type,
        media: media,
        qualities,
        source: "btch"
      };
    }
  } catch (e) {
    // silently ignore btch-downloader errors
  }
  return null;
}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched successfully!");
} else {
  console.log("Target not found!");
}
