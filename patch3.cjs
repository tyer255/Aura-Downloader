const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  `        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
          errorMsg = "Twitter blocked our server IP for unauthenticated requests. Add your RAPIDAPI_KEY to AI Studio Secrets and subscribe to 'Twitter135' on RapidAPI, OR set your TWITTER_AUTH_TOKEN.";
        }`,
  `        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
          errorMsg = "Twitter blocked our server IP for unauthenticated requests. Add your RAPIDAPI_KEY to AI Studio Secrets and subscribe to 'Twitter135' on RapidAPI, OR set your TWITTER_AUTH_TOKEN.";
        } else if (platform === 'snapchat') {
          errorMsg = "This Snapchat content is private or unavailable.";
        }`
);

fs.writeFileSync('server.ts', serverContent);
console.log("Patched server.ts for snapchat error msg");
