const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

// Patch extractPinterestNative
const nativeFind = `        return {
           success: true,
           title: title || "Pinterest Video",
           thumbnail: imageUrl || "",
           url: videoUrl,
           mediaType: "video",
           qualities: getFallbackQualities(videoUrl, "video"),
           media: [{ type: "video", url: videoUrl, thumbnail: imageUrl || "" }]
        };`;

const nativeReplace = `        const mediaList = [{ type: "video", url: videoUrl, thumbnail: imageUrl || "" }];
        const qualities = getFallbackQualities(videoUrl, "video");
        if (imageUrl) {
            mediaList.push({ type: "image", url: imageUrl, thumbnail: imageUrl || "", title: "Thumbnail Image" } as any);
            qualities.push({ label: "Thumbnail Image", url: imageUrl, ext: "jpg" } as any);
        }
        return {
           success: true,
           title: title || "Pinterest Video",
           thumbnail: imageUrl || "",
           url: videoUrl,
           mediaType: "video",
           qualities: qualities,
           media: mediaList
        };`;

server = server.replace(nativeFind, nativeReplace);

// Patch extractPinterestBtch
const btchFind = `           return {
             success: true,
             title: pin.title || pin.description || "Pinterest Pin",
             thumbnail: pin.image || pin.images?.orig?.url || "",
             url: primaryUrl,
             mediaType: mediaType,
             qualities: mediaType === "video" ? getFallbackQualities(primaryUrl, "video") : undefined,
             media: [{ type: mediaType, url: primaryUrl, thumbnail: pin.image || "" }]
           };`;

const btchReplace = `           const thumbUrl = pin.image || pin.images?.orig?.url || "";
           const mediaList = [{ type: mediaType, url: primaryUrl, thumbnail: thumbUrl }];
           let qualities = mediaType === "video" ? getFallbackQualities(primaryUrl, "video") : undefined;
           
           if (mediaType === "video" && thumbUrl) {
               mediaList.push({ type: "image", url: thumbUrl, thumbnail: thumbUrl, title: "Thumbnail Image" } as any);
               if (qualities) {
                   qualities.push({ label: "Thumbnail Image", url: thumbUrl, ext: "jpg" } as any);
               } else {
                   qualities = [{ label: "Thumbnail Image", url: thumbUrl, ext: "jpg" }] as any;
               }
           }
           
           return {
             success: true,
             title: pin.title || pin.description || "Pinterest Pin",
             thumbnail: thumbUrl,
             url: primaryUrl,
             mediaType: mediaType,
             qualities: qualities,
             media: mediaList
           };`;

server = server.replace(btchFind, btchReplace);

fs.writeFileSync('server.ts', server);
console.log("Patched dual download for Pinterest.");
