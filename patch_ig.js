import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`        if (mediaUrl) {
       return {
          success: true,
          title: title,
          url: \`/api/proxy-download?url=\${encodeURIComponent(mediaUrl)}&filename=instagram_\${mediaType}\`,
          thumbnail: thumbnail,
          mediaType: mediaType,
          source: "rapidapi"
       };
    }`,
`        if (mediaUrl) {
       return {
          success: true,
          title: title,
          url: \`/api/proxy-download?url=\${encodeURIComponent(mediaUrl)}&filename=instagram_\${mediaType}\`,
          thumbnail: thumbnail,
          mediaType: mediaType,
          qualities: mediaType === "video" ? getFallbackQualities(mediaUrl, "video") : undefined,
          source: "rapidapi"
       };
    }`
);

fs.writeFileSync('server.ts', code);
console.log("Patched Instagram RapidAPI");
