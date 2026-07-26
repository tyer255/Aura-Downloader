const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove extractWithCobalt
code = code.replace(/async function extractWithCobalt[\s\S]*?async function extractInstagramRapidAPI/, 'async function extractInstagramRapidAPI');

// 2. Remove extractWithCobalt from fastRace
code = code.replace(/\/\/ Universally add Cobalt[\s\S]*?racePromises\.push\(extractWithCobalt\(trimmedUrl\)\);\n/g, '');

// 3. Add extractTiktokTikwm
const tikwmFunc = `
async function extractTiktokTikwm(url: string) {
    try {
        console.log("Trying tikwm for TikTok...");
        const res = await fetch(\`https://www.tikwm.com/api/?url=\${encodeURIComponent(url)}\`);
        const data = await res.json();
        if (data && data.data) {
            const media = [];
            let mediaType = "video";
            let thumbnailUrl = data.data.cover || "";
            let mainUrl = data.data.play || data.data.wmplay || data.data.hdplay || "";
            
            if (data.data.images && data.data.images.length > 0) {
                mediaType = "carousel";
                data.data.images.forEach((img: string) => {
                    media.push({ type: "image", url: img, thumbnail: img });
                });
                thumbnailUrl = data.data.images[0];
                mainUrl = data.data.images[0];
            } else if (mainUrl) {
                media.push({ type: "video", url: mainUrl, thumbnail: thumbnailUrl });
            }
            
            if (media.length > 0) {
                return {
                    success: true,
                    title: data.data.title || "TikTok Video",
                    thumbnail: thumbnailUrl,
                    url: mainUrl,
                    mediaType: mediaType,
                    source: "tikwm",
                    media: media,
                    qualities: mediaType === "video" ? [
                        { label: "HD Video", url: data.data.hdplay || mainUrl, ext: "mp4", size: "HD" },
                        { label: "Audio", url: data.data.music || data.data.music_info?.play, ext: "mp3", size: "Audio" }
                    ] : undefined
                };
            }
        }
    } catch(e) {
        console.error("tikwm error:", e.message);
    }
    return null;
}
`;

code = code.replace('async function extractInstagramBtch', tikwmFunc + '\nasync function extractInstagramBtch');

// 4. Add extractTiktokTikwm to route
code = code.replace(/} else if \(platform === 'tiktok'\) \{([\s\S]*?)racePromises\.push\(extractWithYtDlp\(trimmedUrl\)\);/g, "} else if (platform === 'tiktok') {\n            racePromises.push(extractTiktokTikwm(trimmedUrl));\n            racePromises.push(extractWithYtDlp(trimmedUrl));");

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
