const fs = require('fs');
let serverFile = fs.readFileSync('server.ts', 'utf-8');

const oldInst = `1. Locate high-quality direct download or stream URLs. Look for CDN patterns, source tags, og:video, og:image, and JSON blobs.
2. If this is a profile page (YouTube channel, Instagram user, TikTok user, Facebook profile, Pinterest profile), extract user profile information: avatar picture URL (high res), banner picture URL, display name, follower counts, bio.
3. If this is a post containing multiple images (Instagram carousel, YouTube community post, Facebook gallery), return ALL extracted media items in the "media" array.
4. If it's a video, get the highest quality .mp4 or .m3u8 stream.
5. Return the result strictly in JSON format matching the response schema. No conversational wrapper or markdown formatting.`;

const newInst = `1. Locate high-quality direct download or stream URLs. Look for CDN patterns, source tags, og:video, og:image, and JSON blobs.
2. If this is a profile page (YouTube channel, Instagram user, TikTok user, Facebook profile, Pinterest profile, LinkedIn profile), extract user profile information: avatar picture URL (high res), banner picture URL, display name, follower counts, bio.
3. If this is a profile page or community post, ALWAYS extract up to 15 recent media posts (videos, shorts, photos, reels, gallery) from the profile (if available in the HTML). Put these in the "media" array with the appropriate type ("video" or "image").
4. If this is a post containing multiple images (Instagram carousel, YouTube community post, Facebook gallery), return ALL extracted media items in the "media" array.
5. If it's a video, get the highest quality .mp4 or .m3u8 stream.
6. Return the result strictly in JSON format matching the response schema. No conversational wrapper or markdown formatting.`;

if (serverFile.includes(oldInst)) {
  serverFile = serverFile.replace(oldInst, newInst);
  console.log("Updated AI instructions");
  fs.writeFileSync('server.ts', serverFile);
} else {
  console.log("Could not find old instructions.");
}
