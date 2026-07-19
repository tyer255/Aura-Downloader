import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const newFunc = `
async function extractPinterestBtch(url: string) {
  console.log("Trying btch-downloader for Pinterest...");
  try {
    const mod = await import('btch-downloader');
    const pinterest = mod.pinterest || (mod.default && mod.default.pinterest);
    if (!pinterest) {
        console.log("pinterest function not found in btch-downloader");
        return null;
    }
    const r = await pinterest(url);
    if (r && r.status && r.result && r.result.result) {
       const pin = r.result.result;
       let mediaType = "image";
       let primaryUrl = pin.image || pin.images?.orig?.url;
       
       if (pin.is_video && pin.video_url) {
           mediaType = "video";
           primaryUrl = pin.video_url;
       } else if (pin.videos && pin.videos.V_720P) {
           mediaType = "video";
           primaryUrl = pin.videos.V_720P.url;
       } else if (pin.videos && pin.videos.V_1080P) {
           mediaType = "video";
           primaryUrl = pin.videos.V_1080P.url;
       }

       // Handle GIF if the image url ends with .gif
       if (mediaType === "image" && primaryUrl && primaryUrl.toLowerCase().endsWith('.gif')) {
           mediaType = "gif";
       }
       
       if (primaryUrl) {
           return {
             success: true,
             title: pin.title || pin.description || "Pinterest Pin",
             thumbnail: pin.image || pin.images?.orig?.url || "",
             url: primaryUrl,
             mediaType: mediaType,
             qualities: mediaType === "video" ? getFallbackQualities(primaryUrl, "video") : undefined,
             media: [{ type: mediaType, url: primaryUrl, thumbnail: pin.image || "" }]
           };
       }
    }
  } catch (e) {
    console.error("btch-downloader pinterest error:", e);
  }
  return null;
}
`;

content = content.replace('async function extractInstagramBtch', newFunc + '\nasync function extractInstagramBtch');

const oldLogic = `
        console.log("Trying Cobalt API...");
        const cobaltResult = await extractWithCobalt(trimmedUrl);
`;

const newLogic = `
        if (platform === 'pinterest') {
            const pinResult = await extractPinterestBtch(trimmedUrl);
            if (pinResult && pinResult.success) {
                return res.json(pinResult);
            }
        }
        
        console.log("Trying Cobalt API...");
        const cobaltResult = await extractWithCobalt(trimmedUrl);
`;

content = content.replace(oldLogic, newLogic);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts");
