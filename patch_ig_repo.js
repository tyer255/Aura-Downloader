import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`        if (mediaUrl) {
       return {
          success: true,
          title: "Instagram Post",
          url: \`/api/proxy-download?url=\${encodeURIComponent(mediaUrl)}&filename=instagram_\${mediaType}\`,
          thumbnail: thumbnail,
          mediaType: mediaType,
          source: "repo_backend"
       };
    }`,
`        if (mediaUrl) {
       return {
          success: true,
          title: "Instagram Post",
          url: \`/api/proxy-download?url=\${encodeURIComponent(mediaUrl)}&filename=instagram_\${mediaType}\`,
          thumbnail: thumbnail,
          mediaType: mediaType,
          qualities: mediaType === "video" ? getFallbackQualities(mediaUrl, "video") : undefined,
          source: "repo_backend"
       };
    }`
);

fs.writeFileSync('server.ts', code);
console.log("Patched Instagram Repo Backend");
