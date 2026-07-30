import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`          return {
            success: true,
            title: spotlightStories[0]?.metadata?.videoMetadata?.description || "Snapchat Spotlight",
            thumbnail: spotlightStories[0]?.metadata?.videoMetadata?.thumbnailUrl || spotlightStories[0].story?.thumbnailUrl || videoUrl,
            url: videoUrl,
            mediaType: "video",
            source: "native"
          };`,
`          return {
            success: true,
            title: spotlightStories[0]?.metadata?.videoMetadata?.description || "Snapchat Spotlight",
            thumbnail: spotlightStories[0]?.metadata?.videoMetadata?.thumbnailUrl || spotlightStories[0].story?.thumbnailUrl || videoUrl,
            url: videoUrl,
            mediaType: "video",
            qualities: getFallbackQualities(videoUrl, "video"),
            source: "native"
          };`
);

code = code.replace(
`          return {
            success: true,
            title: story.storyTitle || "Snapchat Story",
            url: videoUrl,
            thumbnail: story.thumbnailUrl || videoUrl,
            mediaType: "video",
            source: "native"
          }`,
`          return {
            success: true,
            title: story.storyTitle || "Snapchat Story",
            url: videoUrl,
            thumbnail: story.thumbnailUrl || videoUrl,
            mediaType: "video",
            qualities: getFallbackQualities(videoUrl, "video"),
            source: "native"
          }`
);

fs.writeFileSync('server.ts', code);
console.log("Patched Snapchat Native");
