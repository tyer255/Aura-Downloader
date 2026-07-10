const { shortcodeToMediaID } = require('insta-fetcher');
const shortcodeMatch = "https://www.instagram.com/reel/C7pM63fK30K/?igsh=...".match(/(?:reel|p|tv|reels)\/([a-zA-Z0-9_-]+)/);
const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;
if (shortcode) {
  console.log("Shortcode:", shortcode);
  const mediaId = shortcodeToMediaID(shortcode);
  console.log("Media ID:", mediaId);
}
